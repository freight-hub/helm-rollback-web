package webserver

import (
	"internal/utility"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"

	"fmt"
	"html/template"
	"net/http"
	"os"
	"strings"
	"time"

	rgb "github.com/foresthoffman/rgblog"
)

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
	_ = strings.ToLower("Hello")
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

func ReactIndexHandler(entrypoint string) func(w http.ResponseWriter, r *http.Request) {
	fn := func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, entrypoint)
	}

	return http.HandlerFunc(fn)
}

func HandleHTTP(GoogleClientID string, GoogleClientSecret string, port string) {
	rgb.YPrintf("[%s] Inside Go Func...\n", utility.TimeStamp())
	r := mux.NewRouter()
	loggedRouter := handlers.LoggingHandler(os.Stdout, r)
	r.NotFoundHandler = http.HandlerFunc(NotFoundHandler)
	r.HandleFunc("/healthz", HealthHandler)
	r.HandleFunc("/web/{.*}", TemplateHandler)
	r.PathPrefix("/static").Handler(http.StripPrefix("/static", http.FileServer(http.Dir("./web/react-frontend/static"))))
	r.PathPrefix("/").HandlerFunc(ReactIndexHandler("./web/react-frontend/index.html"))
	http.Handle("/", r)
	srv := &http.Server{
		Handler:      loggedRouter,
		Addr:         "0.0.0.0:" + port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	fmt.Println("Listening on 0.0.0.0:" + port)
	srv.ListenAndServe()
}
