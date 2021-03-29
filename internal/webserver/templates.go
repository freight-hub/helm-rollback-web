package webserver

import (
	"html/template"
	"net/http"
	"strings"
)

func NotFoundHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "web/404.html")
	response.WriteHeader(404)
	tmpl := template.Must(template.ParseFiles("web/404.html"))
	tmpl.Execute(response, nil)
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

func UnauthorizedHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "web/401.html")
	response.WriteHeader(401)
	tmpl := template.Must(template.ParseFiles("web/401.html"))
	tmpl.Execute(response, nil)
}

func ServerErrorHandler(response http.ResponseWriter, request *http.Request) {
	response.Header().Add("X-Template-File", "web/503.html")
	response.WriteHeader(503)
	tmpl := template.Must(template.ParseFiles("web/503.html"))
	tmpl.Execute(response, nil)
}
