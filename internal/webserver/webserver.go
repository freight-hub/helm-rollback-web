package webserver

import (
	"context"
	"encoding/json"
	"internal/utility"
	"io/ioutil"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"strings"
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

type loginStruct struct {
	Id            string `json:"id"` // Go has no int128 type. I've seen this before.
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	PictureUrl    string `json:"picture"`
	HD            string `json:"hd"`
}

func GoogleLoginHandler(response http.ResponseWriter, request *http.Request) {
	LoginHandler(response, request, oauthConfGl, oauthStateStringGl)
}

func LoginHandler(response http.ResponseWriter, request *http.Request, oauthConf *oauth2.Config, oauthStateString string) {
	URL, err := url.Parse(oauthConf.Endpoint.AuthURL)
	if err != nil {
		log.Error("Parse: " + err.Error())
	}
	log.Info(URL.String())
	parameters := url.Values{}
	parameters.Add("client_id", oauthConf.ClientID)
	parameters.Add("scope", strings.Join(oauthConf.Scopes, " "))
	parameters.Add("redirect_uri", oauthConf.RedirectURL)
	parameters.Add("response_type", "code")
	parameters.Add("state", oauthStateString)
	URL.RawQuery = parameters.Encode()
	url := URL.String()
	log.Info(url)
	http.Redirect(response, request, url, http.StatusTemporaryRedirect)
}

/*
CallBackFromGoogleHandler Function
*/
func CallBackFromGoogleHandler(response http.ResponseWriter, request *http.Request) {
	session, _ := sessionStorage.Get(request, "session-name")
	log.Info("Callback-gl..")

	state := request.FormValue("state")
	log.Info(state)
	if state != oauthStateStringGl {
		log.Info("invalid oauth state, expected " + oauthStateStringGl + ", got " + state + "\n")
		http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
		return
	}

	code := request.FormValue("code")
	log.Info(code)

	if code == "" {
		log.Warning("Code not found..")
		response.Write([]byte("Code Not Found to provide AccessToken..\n"))
		reason := request.FormValue("error_reason")
		if reason == "user_denied" {
			response.Write([]byte("User has denied Permission.."))
		}
		// User has denied access..
		// http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
	} else {
		token, err := oauthConfGl.Exchange(oauth2.NoContext, code)
		if err != nil {
			log.Error("oauthConfGl.Exchange() failed with " + err.Error() + "\n")
			return
		}
		log.Info("TOKEN>> AccessToken>> " + token.AccessToken)
		log.Info("TOKEN>> Expiration Time>> " + token.Expiry.String())
		log.Info("TOKEN>> RefreshToken>> " + token.RefreshToken)

		resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + url.QueryEscape(token.AccessToken))
		if err != nil {
			log.Error("Get: " + err.Error() + "\n")
			http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
			return
		}
		defer resp.Body.Close()

		respBytes, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			log.Error("ReadAll: " + err.Error() + "\n")
			http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
			return
		}

		log.Info("parseResponseBody: " + string(respBytes) + "\n")

		var loginData loginStruct
		err = json.Unmarshal([]byte(respBytes), &loginData)
		if err != nil {
			log.Error("Unmarshal: " + err.Error() + "\n")
			http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
			return
		}
		session.Values["userEmail"] = loginData.Email
		err = session.Save(request, response)
		if err != nil {
			log.Error("Session save error: " + err.Error() + "\n")
			http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
			return
		}
		log.InfoF("Successfully logged in user %s", loginData.Email)
		http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
		return
	}
}

func LoginStatusHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("Content-type", "application/json")
	session, _ := sessionStorage.Get(request, "session-name")
	if session.Values["userEmail"] != nil {
		fmt.Fprintf(response, `{"email":"%s"}`, session.Values["userEmail"])
	} else {
		fmt.Fprintf(response, `{"email":null}`)
	}
}

func HelmListHandler(response http.ResponseWriter, request *http.Request) {
	session, _ := sessionStorage.Get(request, "session-name")
	if session.Values["userEmail"] == nil {
		UnauthorizedHandler(response, request)
		return
	}
	userEmail := session.Values["userEmail"].(string)
	if !utility.UserIsAllowed(userEmail) {
		UnauthorizedHandler(response, request)
		return
	}
	log.Info("Executing `" + helmCommand + " list -o json --all-namespaces --time-format 2006-01-02T15:04:05Z")
	out, err := exec.Command(helmCommand, "list", "-o", "json", "--all-namespaces", "--time-format", "2006-01-02T15:04:05Z").Output()
	if err != nil {
		log.Error(err.Error())
		ServerErrorHandler(response, request)
		return
	}
	type releaseStruct struct {
		ReleaseName       string `json:"name"` // Go has no int128 type. I've seen this before.
		ReleaseNamespace  string `json:"namespace"`
		ReleaseRevision   string `json:"revision"`
		ReleaseUpdated    string `json:"updated"`
		ReleaseStatus     string `json:"status"`
		ReleaseChart      string `json:"chart"`
		ReleaseAppVersion string `json:"app_version"`
	}
	var releases []releaseStruct
	err = json.Unmarshal([]byte(out), &releases)
	if err != nil {
		log.Error(err.Error())
		ServerErrorHandler(response, request)
		return
	}
	response.Header().Add("Content-type", "application/json")
	fmt.Fprint(response, string(out))
}

func HelmHistoryHandler(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	session, _ := sessionStorage.Get(request, "session-name")
	if session.Values["userEmail"] == nil {
		UnauthorizedHandler(response, request)
		return
	}
	userEmail := session.Values["userEmail"].(string)
	if !utility.UserIsAllowed(userEmail) {
		UnauthorizedHandler(response, request)
		return
	}
	log.Info("Executing `" + helmCommand + " history -o json --namespace " + vars["namespace"] + " " + vars["releasename"])
	out, err := exec.Command(helmCommand, "history", "-o", "json", "--namespace", vars["namespace"], vars["releasename"]).Output()
	if err != nil {
		log.Error(err.Error())
		ServerErrorHandler(response, request)
		return
	}
	type releaseStruct struct {
		ReleaseName       string `json:"name"`
		ReleaseRevision   int    `json:"revision"`
		ReleaseUpdated    string `json:"updated"`
		ReleaseStatus     string `json:"status"`
		ReleaseChart      string `json:"chart"`
		ReleaseAppVersion string `json:"app_version"`
	}
	var releases []releaseStruct
	err = json.Unmarshal([]byte(out), &releases)
	if err != nil {
		log.Error(err.Error())
		ServerErrorHandler(response, request)
		return
	}
	response.Header().Add("Content-type", "application/json")
	fmt.Fprint(response, string(out))
}

func HelmRollBackHandler(response http.ResponseWriter, request *http.Request) {
	vars := mux.Vars(request)
	session, _ := sessionStorage.Get(request, "session-name")
	if session.Values["userEmail"] == nil {
		log.Warning("No user session provided")
		UnauthorizedHandler(response, request)
		return
	}
	userEmail := session.Values["userEmail"].(string)
	if !utility.UserIsAllowed(userEmail) {
		log.WarningF("User `%s` is not allowed to rollback!")
		UnauthorizedHandler(response, request)
		return
	}
	log.Info("Executing `" + helmCommand + " rollback --namespace " + vars["namespace"] + " " + vars["releasename"] + " " + vars["revision"] + " (by " + userEmail + ")")
	out, err := exec.Command(helmCommand, "rollback", "--namespace", vars["namespace"], vars["releasename"], vars["revision"]).Output()
	if err != nil {
		log.ErrorF("Error rolling back release %s in namespace %s to revision %s, error is %s", vars["releasename"], vars["namespace"], vars["revision"], err.Error())
		ServerErrorHandler(response, request)
		return
	}

	title := fmt.Sprintf("rolled back %v to revision %v",
		vars["releasename"], vars["revision"])
	link := fmt.Sprintf("%v/rollback/%v/%v",
		os.Getenv("HELM_ROLLBACK_WEB_HOSTNAME"), vars["namespace"], vars["releasename"])
	attachment := slack.Attachment{
		Color:      "#3BB9FF",
		AuthorName: userEmail,
		Title:      title,
		TitleLink:  link,
		Text:       string(out),
	}
	namespace, err := clientset.CoreV1().Namespaces().Get(context.TODO(), vars["namespace"], metav1.GetOptions{})
	if err != nil {
		log.Error(err.Error())
	} else {
		channel := namespace.Annotations["slack-channel"]
		_, _, err = slackClient.PostMessage(string(channel), slack.MsgOptionAttachments(attachment))
		if err != nil {
			log.Error(err.Error())
		}
	}

	response.Header().Add("Content-type", "text/plain")
	fmt.Fprint(response, string(out))
}

func HealthHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("Content-type", "text/plain")
	fmt.Fprint(response, "I'm okay jack!")
}

func NotFoundHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "html"+request.URL.Path)
	response.WriteHeader(404)
	tmpl := template.Must(template.ParseFiles("web/404.html"))
	tmpl.Execute(response, nil)
}

func CSSHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("Content-type", "text/css")
	tmpl := template.Must(template.ParseFiles("web/cover.css"))
	tmpl.Execute(response, nil)
}

func RootHandler(response http.ResponseWriter, request *http.Request) {
	request.URL.Path = "/index.html"
	TemplateHandler(response, request)
}

func TemplateHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "web"+request.URL.Path)
	type TemplateData struct {
		Prompt       string
		AvailCount   int
		ChannelCount int
		MessageCount int
		ClientID     string
		BaseURI      string
	}
	if strings.Index(request.URL.Path, "/") < 0 {
		http.Error(response, "No slashes wat - "+request.URL.Path, http.StatusInternalServerError)
		return
	}

	basenameSlice := strings.Split(request.URL.Path, "/")
	basename := basenameSlice[len(basenameSlice)-1]
	//fmt.Fprintf(response, "%q", basenameSlice)
	tmpl, err := template.New(basename).Funcs(template.FuncMap{
		"ToUpper": strings.ToUpper,
		"ToLower": strings.ToLower,
	}).ParseFiles("web" + request.URL.Path)
	if err != nil {
		http.Error(response, err.Error(), http.StatusInternalServerError)
		return
		// NotFoundHandler(response, request)
		// return
	}
	var td = TemplateData{}
	err = tmpl.Execute(response, td)
	if err != nil {
		http.Error(response, err.Error(), http.StatusInternalServerError)
		return
	}
}

func LeaveHandler(response http.ResponseWriter, request *http.Request) {
	request.URL.Path = "/bye.html"
	TemplateHandler(response, request)
}

func UnauthorizedHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "html"+request.URL.Path)
	response.WriteHeader(401)
	tmpl := template.Must(template.ParseFiles("web/401.html"))
	tmpl.Execute(response, nil)
}

func ServerErrorHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "html"+request.URL.Path)
	response.WriteHeader(503)
	tmpl := template.Must(template.ParseFiles("web/503.html"))
	tmpl.Execute(response, nil)
}

func ReactIndexHandler(entrypoint string) func(w http.ResponseWriter, r *http.Request) {
	fn := func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, entrypoint)
	}

	return http.HandlerFunc(fn)
}

func HandleHTTP(GoogleClientID string, GoogleClientSecret string, port string) {
	err := error(nil)
	log, err = logger.New("hrw-webserver", 1, os.Stderr)
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
	r.HandleFunc("/login-status", LoginStatusHandler)
	r.HandleFunc("/healthz", HealthHandler)
	r.HandleFunc("/web/{.*}", TemplateHandler)
	r.PathPrefix("/static").Handler(http.StripPrefix("/static", http.FileServer(http.Dir("./web/react-frontend/static"))))
	r.HandleFunc("/login", GoogleLoginHandler)
	r.HandleFunc("/callback-gl", CallBackFromGoogleHandler)
	r.HandleFunc("/helm-list", HelmListHandler)
	r.HandleFunc("/helm-history/{namespace}/{releasename}", HelmHistoryHandler)
	r.HandleFunc("/dorollback/{namespace}/{releasename}/{revision}", HelmRollBackHandler)
	r.PathPrefix("/").HandlerFunc(ReactIndexHandler("./web/react-frontend/index.html"))
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
