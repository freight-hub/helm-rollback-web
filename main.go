package main

import (
	"encoding/json"
	"io/ioutil"
	"math/rand"
	"os"
	"path/filepath"
	"time"

	utility "internal/utility"
	webserver "internal/webserver"

	logger "github.com/apsdehal/go-logger"
)

type customStringsStruct struct {
	Strings []string `json:"strings,omitempty"`
}

var selectablePrompts []string

var customStrings customStringsStruct

var config utility.ConfigStruct

var log *logger.Logger

func readConfig() {
	var data []byte
	var err error
	configFile := ""
	if os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE") != "" {
		if _, err := os.Stat(os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE")); os.IsNotExist(err) {
			log.Errorf("Error, HELM_ROLLBACK_WEB_CONFIGFILE env var set and '%s' doesn't exist!\n", os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE"))
			os.Exit(1)
		}
		configFile = os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE")
	} else {
		ex, err := os.Executable()
		if err != nil {
			log.Warning("Warning, HELM_ROLLBACK_WEB_CONFIGFILE env var unset and cannot find executable!\n")
		}
		exPath := filepath.Dir(ex)
		if _, err := os.Stat(exPath + "/config.json"); os.IsNotExist(err) {
			log.Warning("Warning, HELM_ROLLBACK_WEB_CONFIGFILE env var unset and `config.json` not alongside executable!\n")
			if _, err := os.Stat("/etc/tstools/config.json"); os.IsNotExist(err) {
				log.Errorf("Error, HELM_ROLLBACK_WEB_CONFIGFILE env var unset and neither '%s' nor '%s' exist!\n", exPath+"/config.json", "/etc/tstools/config.json")
				os.Exit(1)
			} else {
				configFile = "/etc/tstools/config.json"
			}
		} else {
			configFile = exPath + "/config.json"
		}
	}
	data, err = ioutil.ReadFile(configFile)
	if err != nil {
		log.Errorf("Could not read `%s`. File reading error: %s\n", configFile, err)
		os.Exit(1)
	}
	err = json.Unmarshal(data, &config)
	if err != nil {
		log.Errorf("Could not unmarshal `%s`. Unmarshal error: %s\n", configFile, err)
		os.Exit(1)
	}
	log.Infof("Read config file from `%s`\n", configFile)
	log.Infof("config %v\n", config)
	return
}

var buildDate string

func main() {
	err := error(nil)
	log, err = logger.New("hrw-webserver", 1, os.Stderr)
	if err != nil {
		panic(err) // Check for error
	}
	log.Infof("Starting helm-rollback-web server build %s\n", buildDate)
	readConfig()
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
