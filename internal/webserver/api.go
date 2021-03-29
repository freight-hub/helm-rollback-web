package webserver

import (
	"context"
	"encoding/json"
	"helm-rollback-web/internal/utility"

	"github.com/gorilla/mux"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"fmt"
	"net/http"
	"os"
	"os/exec"

	slack "github.com/slack-go/slack"
)

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
	link := fmt.Sprintf("%v/release/%v/%v",
		os.Getenv("HELM_ROLLBACK_WEB_HOSTNAME"), vars["namespace"], vars["releasename"])
	attachment := slack.Attachment{
		Color:      "#3BB9FF",
		AuthorName: userEmail,
		Title:      title,
		TitleLink:  link,
		Text:       string(out),
	}

	// posts message to channel that aggregates all notications
	_, _, err = slackClient.PostMessage(os.Getenv("HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL"), slack.MsgOptionAttachments(attachment))
	if err != nil {
		log.Error(err.Error())
	}

	// finds target channel in slack-channel annotation present in the namespace object
	namespace, err := clientset.CoreV1().Namespaces().Get(context.TODO(), vars["namespace"], metav1.GetOptions{})
	if err != nil {
		log.Error(err.Error())
	} else {
		channel := namespace.Annotations["slack-channel"]
		if len(channel) > 0 {
			// posts message to team specific channel
			_, _, err = slackClient.PostMessage(string(channel), slack.MsgOptionAttachments(attachment))
			if err != nil {
				log.Error(err.Error())
			}
		} else {
			log.Warning(fmt.Sprintf("%v does not contain a slack-channel annotation", vars["namespace"]))
		}
	}

	response.Header().Add("Content-type", "text/plain")
	fmt.Fprint(response, string(out))
}
