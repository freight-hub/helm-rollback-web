FROM golang:1.16.0-alpine AS builder
RUN apk add --no-cache make ca-certificates
WORKDIR /src
COPY Makefile go.mod go.sum ./
RUN make deps
COPY internal/ ./internal/
COPY *.go ./
RUN make static

FROM node:17.0.1-alpine3.13 AS frontend
WORKDIR /frontend
COPY build/react-frontend/package*.json ./
RUN npm ci
COPY build/react-frontend ./
ENV PUBLIC_URL=/pub
RUN npm run build && npm run test -- --watchAll=false

FROM scratch AS final
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/helm-rollback-web /app/
COPY web/ /app/web/
COPY --from=frontend /frontend/build /app/web/react-frontend
COPY --from=alpine/helm:3.5.2 /usr/bin/helm /usr/bin/helm3
WORKDIR /app
CMD ["/app/helm-rollback-web"]
