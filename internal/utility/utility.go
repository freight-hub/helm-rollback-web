package utility

import (
	"time"
	"unicode"
)

const UTCFormat = "Jan 2 15:04:05 UTC"

// ConfigStruct is the base for the config file
type ConfigStruct struct {
}

func TimeStampFmt(format string) string {
	return time.Now().Format(format)
}

func TimeStamp() string {
	return TimeStampFmt(UTCFormat)
}

func IsLower(s string) bool {
	for _, r := range s {
		if !unicode.IsLower(r) && unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

func UserIsAllowed(email string) bool {
	if email[len(email)-10:] == "@forto.com" {
		return true
	} else {
		return false
	}
}
