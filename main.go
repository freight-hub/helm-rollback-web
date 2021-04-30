package main

import (
	"context"
	"math/rand"
	"os"
	"time"

	"helm-rollback-web/internal/webserver"

	logger "github.com/apsdehal/go-logger"
)

var log *logger.Logger

var buildDate string

func main() {
	err := error(nil)
	log, err = logger.New("hrw-webserver", 1, os.Stderr)
	if err != nil {
		panic(err) // Check for error
	}
	log.Infof("Starting helm-rollback-web server build %s\n", buildDate)
	rand.Seed(time.Now().UnixNano())

	// Auth / OpenID Connect configuration
	oidcIssuer := os.Getenv("HELM_ROLLBACK_WEB_OIDC_ISSUER")
	if oidcIssuer == "" {
		log.Warning("Tip: To use Google Accounts, set the issuer value 'https://accounts.google.com'")
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_OIDC_ISSUER")
	}
	oidcClientId := os.Getenv("HELM_ROLLBACK_WEB_OIDC_CLIENT_ID")
	if oidcClientId == "" {
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_OIDC_CLIENT_ID\n")
	}
	oidcClientSecret := os.Getenv("HELM_ROLLBACK_WEB_OIDC_CLIENT_SECRET")
	if oidcClientSecret == "" {
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_OIDC_CLIENT_SECRET\n")
	}
	oidcRedirectURL := os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL")
	if oidcRedirectURL == "" {
		oidcRedirectURL = "http://localhost:8080/callback-gl"
		log.Warningf("Missing env var HELM_ROLLBACK_WEB_CALLBACK_URL. Assuming `%s` - This only works locally!", oidcRedirectURL)
	}
	if err := webserver.ConfigureOidc(context.TODO(), oidcIssuer, oidcClientId, oidcClientSecret, oidcRedirectURL); err != nil {
		log.Fatalf("OpenID Connect auto-configuration failed: %s", err.Error())
	}

	if os.Getenv("SLACK_APP_HELM_OAUTH_TOKEN") == "" {
		log.Fatal("Missing required env var SLACK_APP_HELM_OAUTH_TOKEN\n")
	}
	if os.Getenv("HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL") == "" {
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL\n")
	}
	if os.Getenv("HELM_ROLLBACK_WEB_HELM_COMMAND") == "" {
		log.Info("Missing required env var HELM_ROLLBACK_WEB_HELM_COMMAND assuming `helm`\n")
	}

	log.Infof("Starting webserver on port %s\n", "8080")
	webserver.HandleHTTP("8080")
}
