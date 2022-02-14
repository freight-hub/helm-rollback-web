FROM golang:1.17.7-alpine3.14 AS builder
RUN apk add --no-cache make ca-certificates
WORKDIR /src
COPY Makefile go.mod go.sum ./
RUN make deps
COPY internal/ ./internal/
COPY *.go ./
RUN make static

FROM node:16.13.2-alpine3.14 AS frontend
WORKDIR /frontend
COPY build/react-frontend/package.json build/react-frontend/yarn.lock ./
RUN yarn
COPY build/react-frontend ./
ENV PUBLIC_URL=/pub
RUN yarn build && yarn test -- --watchAll=false

FROM scratch AS final
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /src/helm-rollback-web /app/
COPY web/ /app/web/
COPY --from=frontend /frontend/build /app/web/react-frontend
COPY --from=alpine/helm:3.5.2 /usr/bin/helm /usr/bin/helm3
WORKDIR /app
CMD ["/app/helm-rollback-web"]
