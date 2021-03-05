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
	if os.Getenv("HELM_ROLLBACK_WEB_HELM_COMMAND") == "" {
		log.Infof("Missing required env var HELM_ROLLBACK_WEB_HELM_COMMAND assuming `helm`\n")
	}
	go func() { // Background the webserver, allows for further startup afterwards.
		log.Infof("Starting webserver on port %s\n", "8080")
		webserver.HandleHTTP(os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_ID"), os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET"), "8080")
	}()
	for { // main processing is in the go func, here we sleep for 5 seconds over and over.
		time.Sleep(5000)
	}
}
