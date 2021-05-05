package webserver

import (
	"context"
	"encoding/hex"
	"fmt"
	"os"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/securecookie"
	"golang.org/x/oauth2"

	"net/http"
	"net/url"
)

var (
	oidcInfo    *oidc.Provider
	callbackURL *url.URL
	oauthConf   = &oauth2.Config{
		Scopes: []string{oidc.ScopeOpenID, "email"},
	}
)

func ConfigureOidc(ctx context.Context, issuer string, clientID string, clientSecret string, redirectURL string) error {
	var err error
	oidcInfo, err = oidc.NewProvider(ctx, issuer)
	if err != nil {
		return err
	}

	callbackURL, err = url.Parse(redirectURL)
	if err != nil {
		return fmt.Errorf("couldn't parse callback URL '%s': %w", redirectURL, err)
	}
	if len(callbackURL.Path) < 2 || callbackURL.Path[0] != '/' {
		return fmt.Errorf("redirect URL must include a path (such as /callback)")
	}

	// The google groups authz feature depends on google groups API access
	if os.Getenv("HELM_ROLLBACK_WEB_GOOGLE_GROUP_PASSLIST") != "" {
		oauthConf.Scopes = append(oauthConf.Scopes, "https://www.googleapis.com/auth/cloud-identity.groups.readonly")
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
			ServerErrorHandler(response, request)
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
		response.Write([]byte("OIDC error. The OAuth state value doesn't match expectations.\n"))
		return
	}

	code := request.FormValue("code")
	if code == "" {
		response.Write([]byte("OIDC error. No OAuth code was given from the issuer.\n"))
		reason := request.FormValue("error_reason")
		if reason == "user_denied" {
			reason = "User denied the login."
		}
		response.Write([]byte(fmt.Sprintf("Reason: %s", reason)))
		return
	}

	token, err := oauthConf.Exchange(request.Context(), code)
	if err != nil {
		log.Errorf("oauthConf.Exchange() failed with %s", err.Error())
		response.Write([]byte("OIDC error. Failed to redeem the OAuth code.\n"))
		return
	}
	tokenSource := oauth2.StaticTokenSource(token)

	userInfo, err := oidcInfo.UserInfo(request.Context(), tokenSource)
	if err != nil {
		log.Errorf("UserInfo() failed with %s", err.Error())
		response.Write([]byte("OIDC error. Failed to fetch the user info from the issuer.\n"))
		return
	}

	if userOk, err := confirmUserAuthorized(request.Context(), userInfo, tokenSource); err != nil {
		log.Errorf("confirmAccessByEmail: %s", err.Error())
		ServerErrorHandler(response, request)
		return
	} else if !userOk {
		log.Errorf("Denying login to user %s", userInfo.Email)
		UnauthorizedHandler(response, request)
		return
	}

	// Finally 'log in' the user (from our viewpoint at least)
	session.Values["userEmail"] = userInfo.Email
	err = session.Save(request, response)
	if err != nil {
		log.Errorf("Session save error: %s", err.Error())
		ServerErrorHandler(response, request)
		return
	}
	log.Infof("Successfully logged in user %s", userInfo.Email)
	http.Redirect(response, request, "/", http.StatusTemporaryRedirect)
}
