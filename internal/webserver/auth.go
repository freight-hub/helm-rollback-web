package webserver

import (
	"encoding/json"
	"io/ioutil"

	"golang.org/x/oauth2"

	"net/http"
	"net/url"
	"strings"
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