FROM golang:1.16.0-alpine AS builder
RUN apk update && apk add --no-cache git make ca-certificates && update-ca-certificates
COPY main.go go.mod go.sum /src/
COPY internal/ /src/internal/
COPY Makefile /src/
RUN cd /src; make deps ; make static

FROM library/node:14.7.0-stretch AS frontend
COPY build/react-frontend /frontend
RUN cd /frontend; npm install && npm run build

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/helm-rollback-web /app/
COPY web/ /app/web/
COPY --from=frontend /frontend/build /app/web/react-frontend
WORKDIR /app
CMD ["/app/helm-rollback-web"]
