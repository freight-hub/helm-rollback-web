FROM golang:1.25.6-alpine AS builder
RUN apk add --no-cache make ca-certificates
WORKDIR /src
COPY Makefile go.mod go.sum ./
RUN make deps
COPY internal/ ./internal/
COPY *.go ./
RUN make static

FROM node:25.5.0-alpine AS frontend
RUN npm i -g corepack --force
WORKDIR /frontend
COPY build/react-frontend/package.json build/react-frontend/yarn.lock build/react-frontend/.yarnrc.yml ./
RUN yarn install
COPY build/react-frontend ./
RUN yarn build

# https://hub.docker.com/r/alpine/helm/tags
FROM alpine/helm:4.1.0 AS helm

FROM scratch AS final
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/helm-rollback-web /app/
COPY web/ /app/web/
COPY --from=frontend /frontend/build /app/web/react-frontend
COPY --from=helm /usr/bin/helm /usr/bin/helm3
WORKDIR /app
CMD ["/app/helm-rollback-web"]
