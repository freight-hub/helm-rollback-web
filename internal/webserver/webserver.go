package webserver

import (
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"fmt"
	"net/http"
	"os"
	"time"

	logger "github.com/apsdehal/go-logger"
	slack "github.com/slack-go/slack"
)

var (
	oauthConfGl = &oauth2.Config{
		ClientID:     "",
		ClientSecret: "",
		RedirectURL:  "http://localhost:8080/callback-gl",
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
		Endpoint:     google.Endpoint,
	}
	oauthStateStringGl = ""
	log                *logger.Logger
	sessionStorage     *sessions.CookieStore
	helmCommand        = ""
	clientset          *kubernetes.Clientset
	slackClient        = slack.New(os.Getenv("SLACK_APP_HELM_OAUTH_TOKEN"))
)

func HealthHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("Content-type", "text/plain")
	fmt.Fprint(response, "I'm okay jack!")
}

func ReactIndexHandler(entrypoint string) func(w http.ResponseWriter, r *http.Request) {
	fn := func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, entrypoint)
	}

	return http.HandlerFunc(fn)
}

func HandleHTTP(GoogleClientID string, GoogleClientSecret string, port string) {
	err := error(nil)
	log, err = logger.New("helm-rollback", 1, os.Stderr)
	if err != nil {
		panic(err) // Check for error
	}

	// creates the in-cluster config
	config, err := rest.InClusterConfig()
	if err != nil {
		panic(err.Error())
	}
	// creates the clientset
	clientset, err = kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	helmCommand = os.Getenv("HELM_ROLLBACK_WEB_HELM_COMMAND")
	if helmCommand == "" {
		helmCommand = "helm"
	}
	sessionStorage = sessions.NewCookieStore([]byte(securecookie.GenerateRandomKey(32)))

	if os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL") != "" {
		oauthConfGl.RedirectURL = os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL")
	}
	oauthConfGl.ClientID = GoogleClientID
	oauthConfGl.ClientSecret = GoogleClientSecret
	oauthStateStringGl = ""
	log.InfoF("Inside Go Func...\n")
	r := mux.NewRouter()
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)
	r.NotFoundHandler = http.HandlerFunc(NotFoundHandler)

	// Utility routes
	r.HandleFunc("/healthz", HealthHandler)

	// Session handling
	r.HandleFunc("/login", GoogleLoginHandler)
	r.HandleFunc("/callback-gl", CallBackFromGoogleHandler)

	// API routes that we will serve
	r.HandleFunc("/login-status", LoginStatusHandler)
	r.HandleFunc("/helm-list", HelmListHandler)
	r.HandleFunc("/helm-history/{namespace}/{releasename}", HelmHistoryHandler)
	r.HandleFunc("/dorollback/{namespace}/{releasename}/{revision}", HelmRollBackHandler).Methods("POST")

	// SPA routes, roughly, doesn't need to be exact
	spaHandler := ReactIndexHandler("./web/react-frontend/index.html")
	r.HandleFunc("/", spaHandler)
	r.HandleFunc("/all-releases", spaHandler)
	r.PathPrefix("/namespace/").HandlerFunc(spaHandler)
	r.PathPrefix("/releases/").HandlerFunc(spaHandler)
	r.PathPrefix("/rollback/").HandlerFunc(spaHandler)

	// Static content
	// react is told that it'll be mounted at /pub
	r.PathPrefix("/pub/").Handler(http.StripPrefix("/pub", http.FileServer(http.Dir("./web/react-frontend"))))

	http.Handle("/", r)
	srv := &http.Server{
		Handler:      loggedRouter,
		Addr:         "0.0.0.0:" + port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.InfoF("Listening on 0.0.0.0:%s", port)
	srv.ListenAndServe()
}
