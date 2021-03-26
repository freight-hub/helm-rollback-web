package main

import (
	"math/rand"
	"os"
	"time"

	webserver "internal/webserver"

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
	if os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_ID") == "" {
		log.Errorf("Missing required env var HELM_ROLLBACK_WEB_GCP_CLIENT_ID\n")
		os.Exit(1)
	}
	if os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET") == "" {
		log.Errorf("Missing required env var HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET\n")
		os.Exit(1)
	}
	if os.Getenv("SLACK_APP_HELM_OAUTH_TOKEN") == "" {
		log.Errorf("Missing required env var SLACK_APP_HELM_OAUTH_TOKEN\n")
		os.Exit(1)
	}
	if os.Getenv("HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL") == "" {
		log.Errorf("Missing required env var HELM_ROLLBACK_WEB_NOTIFICATION_CHANNEL\n")
		os.Exit(1)
	}
	if os.Getenv("HELM_ROLLBACK_WEB_HELM_COMMAND") == "" {
		log.Infof("Missing required env var HELM_ROLLBACK_WEB_HELM_COMMAND assuming `helm`\n")
	}
	if os.Getenv("HELM_ROLLBACK_WEB_CALLBACK_URL") == "" {
		log.Warningf("Missing required env var HELM_ROLLBACK_WEB_CALLBACK_URL assuming `http://localhost:8080/callback-gl` - This will almost certainly not work!\n")
	}
	log.Infof("Starting webserver on port %s\n", "8080")
	webserver.HandleHTTP(os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_ID"), os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET"), "8080")
}
