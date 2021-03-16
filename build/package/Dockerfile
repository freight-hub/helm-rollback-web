FROM golang:1.16.0-alpine AS builder
RUN apk add --no-cache git make ca-certificates
COPY main.go go.mod go.sum /src/
COPY internal/ /src/internal/
COPY Makefile /src/
WORKDIR /src
RUN make deps && make static

FROM node:14.16.0-alpine3.13 AS frontend
COPY build/react-frontend /frontend
WORKDIR /frontend
RUN npm ci && npm run build && npm run test -- --watchAll=false

FROM alpine/helm:3.5.2 AS add_helm

FROM scratch
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/helm-rollback-web /app/
COPY web/ /app/web/
COPY --from=frontend /frontend/build /app/web/react-frontend
COPY --from=add_helm /usr/bin/helm /usr/bin/helm3
WORKDIR /app
CMD ["/app/helm-rollback-web"]
