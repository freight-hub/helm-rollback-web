package utility

import (
	"net/http"
)

// UncachedErrorWriter is a wrapper around http.ResponseWriter which manipulates headers/content based on upstream response
type UncachedErrorWriter struct {
	Original     http.ResponseWriter
	ErrorCaching string
}

func (uew *UncachedErrorWriter) Header() http.Header {
	return uew.Original.Header()
}

func (uew *UncachedErrorWriter) Write(b []byte) (int, error) {
	return uew.Original.Write(b)
}

func (uew *UncachedErrorWriter) WriteHeader(s int) {
	if s >= 400 {
		uew.Original.Header().Set("Cache-Control", uew.ErrorCaching)
	}
	uew.Original.WriteHeader(s)
}
