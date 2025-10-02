package main

import (
	"context"
	"fmt"
	"math/rand"
	"os"
	"time"

	"helm-rollback-web/internal/webserver"

	"github.com/DataDog/dd-trace-go/v2/ddtrace/tracer"
	logger "github.com/apsdehal/go-logger"
)

var log *logger.Logger

var buildDate string

func main() {
	tracer.Start()
	defer tracer.Stop()
	err := error(nil)
	log, err = logger.New("hrw-webserver", 1, os.Stderr)
	if err != nil {
		panic(err) // Check for error
	}
	log.Infof("Starting helm-rollback-web server build %s", buildDate)
	rand.Seed(time.Now().UnixNano())

	port := "8080"

	// Auth / OpenID Connect configuration
	oidcIssuer := os.Getenv("HELM_ROLLBACK_WEB_OIDC_ISSUER")
	if oidcIssuer == "" {
		log.Warning("Tip: To use Google Accounts, set the issuer value 'https://accounts.google.com'")
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_OIDC_ISSUER")
	}
	clientId := os.Getenv("HELM_ROLLBACK_WEB_OIDC_CLIENT_ID")
	if clientId == "" {
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_OIDC_CLIENT_ID")
	}
	clientSecret := os.Getenv("HELM_ROLLBACK_WEB_OIDC_CLIENT_SECRET")
	if clientSecret == "" {
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_OIDC_CLIENT_SECRET")
	}
	callbackURL := os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL")
	if callbackURL == "" {
		callbackURL = fmt.Sprintf("http://localhost:%s/callback-gl", port)
		log.Warningf("Missing env var HELM_ROLLBACK_WEB_CALLBACK_URL. Assuming `%s` - This only works locally!", callbackURL)
	}
	// This function fetches the configuration from the issuer
	if err := webserver.ConfigureOidc(context.Background(), oidcIssuer, clientId, clientSecret, callbackURL); err != nil {
		log.Fatalf("OpenID Connect auto-configuration failed: %s", err.Error())
	}

	if os.Getenv("SLACK_APP_HELM_OAUTH_TOKEN") == "" {
		log.Fatal("Missing required env var SLACK_APP_HELM_OAUTH_TOKEN")
	}
	if os.Getenv("HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL") == "" {
		log.Fatal("Missing required env var HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL")
	}
	if os.Getenv("HELM_ROLLBACK_WEB_HELM_COMMAND") == "" {
		log.Info("Missing required env var HELM_ROLLBACK_WEB_HELM_COMMAND assuming `helm`")
	}

	log.Infof("Starting webserver on port %s", port)
	webserver.HandleHTTP(port)
}
