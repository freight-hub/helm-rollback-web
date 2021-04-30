package webserver

import (
	"context"
	"encoding/hex"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/securecookie"
	"golang.org/x/oauth2"

	"net/http"
)

var (
	oidcInfo  *oidc.Provider
	oauthConf = &oauth2.Config{
		Scopes: []string{oidc.ScopeOpenID, "email"},
	}
)

func ConfigureOidc(ctx context.Context, issuer string, clientID string, clientSecret string, redirectURL string) error {
	var err error
	oidcInfo, err = oidc.NewProvider(ctx, issuer)
	if err != nil {
		return err
	}

	oauthConf.Endpoint = oidcInfo.Endpoint()
	oauthConf.RedirectURL = redirectURL
	oauthConf.ClientID = clientID
	oauthConf.ClientSecret = clientSecret

	return nil
}

// LoginHandler redirects the user to the identity provider
func LoginHandler(response http.ResponseWriter, request *http.Request) {
	session, _ := sessionStorage.Get(request, COOKIE_NAME)

	authState, ok := session.Values["authState"].(string)
	if !ok {
		// Generate an initial CSRF token for the user
		authState = hex.EncodeToString(securecookie.GenerateRandomKey(16))
		// Save it into the session
		session.Values["authState"] = authState
		err := session.Save(request, response)
		if err != nil {
			log.Errorf("Session save error: %s", err.Error())
			http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
			return
		}
	}

	url := oauthConf.AuthCodeURL(authState)
	http.Redirect(response, request, url, http.StatusTemporaryRedirect)
}

// OidcCallBackHandler handles redeeming the OIDC code from the Issuer
func OidcCallBackHandler(response http.ResponseWriter, request *http.Request) {
	session, _ := sessionStorage.Get(request, COOKIE_NAME)

	knownState, hasKnownState := session.Values["authState"].(string)
	givenState := request.FormValue("state")
	if !hasKnownState || knownState != givenState {
		log.Infof("invalid oauth state, expected %s, got %s", knownState, givenState)
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
		return
	}

	token, err := oauthConf.Exchange(context.TODO(), code)
	if err != nil {
		log.Errorf("oauthConf.Exchange() failed with %s", err.Error())
		return
	}

	userInfo, err := oidcInfo.UserInfo(context.TODO(), oauth2.StaticTokenSource(token))
	if err != nil {
		log.Errorf("UserInfo: %s", err.Error())
		http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
		return
	}

	if !userInfo.EmailVerified {
		response.Write([]byte("OIDC error. Is your email address verified?\n"))
		return
	}

	// Finally 'log in' the user (from our viewpoint at least)
	session.Values["userEmail"] = userInfo.Email
	err = session.Save(request, response)
	if err != nil {
		log.Errorf("Session save error: %s", err.Error())
		http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
		return
	}
	log.Infof("Successfully logged in user %s", userInfo.Email)
	http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
}
