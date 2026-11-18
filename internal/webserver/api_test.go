package webserver

import (
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	logger "github.com/apsdehal/go-logger"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
)

// signedInRequest builds a POST to the rollback route with a valid session cookie.
func signedInRequest(t *testing.T, namespace, release, revision string) *http.Request {
	t.Helper()
	login := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	session, _ := sessionStorage.Get(login, COOKIE_NAME)
	session.Values["userEmail"] = "engineer@forto.com"
	if err := session.Save(login, rec); err != nil {
		t.Fatalf("saving session: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/dorollback/"+namespace+"/"+release+"/"+revision, nil)
	for _, c := range rec.Result().Cookies() {
		req.AddCookie(c)
	}
	return mux.SetURLVars(req, map[string]string{"namespace": namespace, "releasename": release, "revision": revision})
}

func TestHelmRollBackHandlerRefusesWithoutRunningHelm(t *testing.T) {
	var err error
	log, err = logger.New("test", 0, os.Stderr)
	if err != nil {
		t.Fatal(err)
	}
	sessionStorage = sessions.NewCookieStore(securecookie.GenerateRandomKey(32))

	// A stand-in for helm that leaves a marker file if it is ever run.
	dir := t.TempDir()
	marker := filepath.Join(dir, "helm-ran")
	helmCommand = filepath.Join(dir, "helm")
	t.Setenv("HELM_RAN_MARKER", marker)
	if err := os.WriteFile(helmCommand, []byte("#!/bin/sh\ntouch \"$HELM_RAN_MARKER\"\n"), 0o755); err != nil {
		t.Fatal(err)
	}
	// Prove the stand-in leaves the marker, so its absence below means helm never ran.
	if err := exec.Command(helmCommand).Run(); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(marker); err != nil {
		t.Fatalf("stand-in helm did not write its marker: %v", err)
	}
	if err := os.Remove(marker); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name       string
		release    string
		wantStatus int
	}{
		{"release deployed by Flux", "macro-view", http.StatusConflict},
		{"lookup fails: two components for one release", "ambiguous", http.StatusServiceUnavailable},
	}
	dynamicClient = fakeClient(
		component("macro-view", "macro-view", "macro-view", "corehelm-operator"),
		component("a", "macro-view", "ambiguous", "corehelm-operator"),
		component("b", "macro-view", "ambiguous", "circleci-helm-orb"),
	)

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			HelmRollBackHandler(rec, signedInRequest(t, "macro-view", tt.release, "3"))

			if rec.Code != tt.wantStatus {
				t.Fatalf("status %d, want %d (body %q)", rec.Code, tt.wantStatus, rec.Body.String())
			}
			if _, err := os.Stat(marker); !os.IsNotExist(err) {
				t.Fatal("helm was run for a refused rollback")
			}
		})
	}
}
