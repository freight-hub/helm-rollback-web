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

	rgb "github.com/foresthoffman/rgblog"
)

type customStringsStruct struct {
	Strings []string `json:"strings,omitempty"`
}

var selectablePrompts []string

var customStrings customStringsStruct

var config utility.ConfigStruct

func readConfig() {
	var data []byte
	var err error
	configFile := ""
	if os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE") != "" {
		if _, err := os.Stat(os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE")); os.IsNotExist(err) {
			rgb.RPrintf("[%s] Error, HELM_ROLLBACK_WEB_CONFIGFILE env var set and '%s' doesn't exist!\n", utility.TimeStamp(), os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE"))
			os.Exit(1)
		}
		configFile = os.Getenv("HELM_ROLLBACK_WEB_CONFIGFILE")
	} else {
		ex, err := os.Executable()
		if err != nil {
			rgb.YPrintf("[%s] Warning, HELM_ROLLBACK_WEB_CONFIGFILE env var unset and cannot find executable!\n", utility.TimeStamp())
		}
		exPath := filepath.Dir(ex)
		if _, err := os.Stat(exPath + "/config.json"); os.IsNotExist(err) {
			rgb.YPrintf("[%s] Warning, HELM_ROLLBACK_WEB_CONFIGFILE env var unset and `config.json` not alongside executable!\n", utility.TimeStamp())
			if _, err := os.Stat("/etc/tstools/config.json"); os.IsNotExist(err) {
				rgb.RPrintf("[%s] Error, HELM_ROLLBACK_WEB_CONFIGFILE env var unset and neither '%s' nor '%s' exist!\n", utility.TimeStamp(), exPath+"/config.json", "/etc/tstools/config.json")
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
		rgb.RPrintf("[%s] Could not read `%s`. File reading error: %s\n", utility.TimeStamp(), configFile, err)
		os.Exit(1)
	}
	err = json.Unmarshal(data, &config)
	if err != nil {
		rgb.RPrintf("[%s] Could not unmarshal `%s`. Unmarshal error: %s\n", utility.TimeStamp(), configFile, err)
		os.Exit(1)
	}
	rgb.YPrintf("[%s] Read config file from `%s`\n", utility.TimeStamp(), configFile)
	rgb.YPrintf("[%s] config %v\n", utility.TimeStamp(), config)
	return
}

var buildDate string

func main() {
	rgb.YPrintf("[%s] starting helm-rollback-web server build %s\n", utility.TimeStamp(), buildDate)
	readConfig()
	rand.Seed(time.Now().UnixNano())
	if os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_ID") == "" {
		rgb.RPrintf("[%s] Missing required env var HELM_ROLLBACK_WEB_GCP_CLIENT_ID")
	}
	if os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET") == "" {
		rgb.RPrintf("[%s] Missing required env var HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET")
	}
	go func() { // Background the webserver, allows for further startup afterwards.
		rgb.YPrintf("[%s] Starting webserver on port %s\n", utility.TimeStamp(), "8080")
		webserver.HandleHTTP(os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_ID"), os.Getenv("HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET"), "8080")
	}()
	for { // main processing is in the go func, here we sleep for 5 seconds over and over.
		time.Sleep(5000)
	}
}
