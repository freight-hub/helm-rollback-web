package webserver

import (
	"context"
	"helm-rollback-web/internal/utility"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"

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
	log            *logger.Logger
	sessionStorage *sessions.CookieStore
	helmCommand    = ""
	clientset      *kubernetes.Clientset
	slackClient    = slack.New(os.Getenv("SLACK_APP_HELM_OAUTH_TOKEN"))
)

func HealthHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("Content-type", "text/plain")
	fmt.Fprint(response, "I'm okay jack!")
}

func ReactIndexHandler(entrypoint string) func(w http.ResponseWriter, r *http.Request) {
	fn := func(w http.ResponseWriter, r *http.Request) {

		// require caches to be revalidated w/ server before reuse
		w.Header().Add("Cache-Control", "public, no-cache")

		http.ServeFile(w, r, entrypoint)
	}

	return http.HandlerFunc(fn)
}

func HandleHTTP(OidcServer string, OidcClientID string, OidcClientSecret string, port string) {
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

	oidcInfo, err = oidc.NewProvider(context.TODO(), OidcServer)
	if err != nil {
		panic(err.Error())
	}
	oauthConfGl.Endpoint = oidcInfo.Endpoint()

	if os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL") != "" {
		oauthConfGl.RedirectURL = os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL")
	}
	oauthConfGl.ClientID = OidcClientID
	oauthConfGl.ClientSecret = OidcClientSecret

	log.InfoF("Inside Go Func...\n")
	r := mux.NewRouter()
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)
	r.NotFoundHandler = http.HandlerFunc(NotFoundHandler)

	// Utility routes
	r.HandleFunc("/healthz", HealthHandler)

	// Session handling
	r.HandleFunc("/login", OidcLoginHandler)
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
	r.PathPrefix("/release/").HandlerFunc(spaHandler)
	r.PathPrefix("/rollback/").HandlerFunc(spaHandler)

	// Static content
	// react is told that it'll be mounted at /pub
	staticServer := http.StripPrefix("/pub", http.FileServer(http.Dir("./web/react-frontend")))
	r.PathPrefix("/pub/static/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// All files inside static are keyed by hash
		w.Header().Add("Cache-Control", "public, max-age=604800, immutable")
		// Also loosen caching on 404 to prevent mixed-fleet poisoning
		staticServer.ServeHTTP(&utility.UncachedErrorWriter{
			Original:     w,
			ErrorCaching: "public, no-cache, max-age=60",
		}, r)
	})
	r.PathPrefix("/pub/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// icons etc aren't hashed
		w.Header().Add("Cache-Control", "public, max-age=300")
		staticServer.ServeHTTP(w, r)
	})

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
