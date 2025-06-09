FROM golang:1.24.4-alpine AS builder
RUN apk add --no-cache make ca-certificates
WORKDIR /src
COPY Makefile go.mod go.sum ./
RUN make deps
COPY internal/ ./internal/
COPY *.go ./
RUN make static

FROM node:24.1.0-alpine AS frontend
WORKDIR /frontend
COPY build/react-frontend/package.json build/react-frontend/yarn.lock ./
RUN yarn
COPY build/react-frontend ./
ENV PUBLIC_URL=/pub
RUN yarn build && yarn test -- --watchAll=false

# https://hub.docker.com/r/alpine/helm/tags
FROM alpine/helm:3.18.1 AS helm

FROM scratch AS final
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/helm-rollback-web /app/
COPY web/ /app/web/
COPY --from=frontend /frontend/build /app/web/react-frontend
COPY --from=helm /usr/bin/helm /usr/bin/helm3
WORKDIR /app
CMD ["/app/helm-rollback-web"]
