module helm-rollback-web

go 1.14

replace internal/utility => ./internal/utility

replace internal/webserver => ./internal/webserver

require (
	github.com/apsdehal/go-logger v0.0.0-20190515212710-b0d6ccfee0e6
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/foresthoffman/rgblog v0.0.0-20170809210153-1abc5df40e10
	github.com/gomodule/redigo v1.8.4 // indirect
	github.com/google/uuid v1.2.0 // indirect
	github.com/gorilla/handlers v1.5.1 // indirect
	github.com/gorilla/mux v1.8.0 // indirect
	github.com/gorilla/sessions v1.2.1 // indirect
	github.com/slack-go/slack v0.8.1
	go.uber.org/zap v1.16.0 // indirect
	golang.org/x/oauth2 v0.0.0-20210220000619-9bb904979d93 // indirect
	internal/utility v0.0.0-00010101000000-000000000000
	internal/webserver v0.0.0-00010101000000-000000000000
	k8s.io/client-go v0.20.4
)
