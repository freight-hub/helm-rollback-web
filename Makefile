BUILD=`date +%FT%T%z`

LDFLAGS=-ldflags "-X main.buildDate=${BUILD}"

.PHONY: build build-frontend deps static

test:
	go test -r .

build:
	go build ${LDFLAGS}

build-frontend:
	cd build/react-frontend && npm install && PUBLIC_URL=/pub npm run build
	rm -rf web/react-frontend ; mkdir -p web/react-frontend
	cp -r build/react-frontend/build/* web/react-frontend/

deps:
	go mod download

static:
	CGO_ENABLED=0 GOOS=linux go build ${LDFLAGS} -a -installsuffix cgo -o helm-rollback-web .
