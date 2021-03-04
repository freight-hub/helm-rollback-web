module helm-rollback-web

go 1.14


replace internal/utility => ./internal/utility

replace internal/webserver => ./internal/webserver

require (
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/foresthoffman/rgblog v0.0.0-20170809210153-1abc5df40e10
	internal/utility v0.0.0-00010101000000-000000000000
	internal/webserver v0.0.0-00010101000000-000000000000
	github.com/gomodule/redigo v1.8.4 // indirect
	github.com/google/uuid v1.2.0 // indirect
	github.com/gorilla/handlers v1.5.1 // indirect
	github.com/gorilla/mux v1.8.0 // indirect
)
