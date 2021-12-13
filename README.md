# helm-rollback-web

Web tool with react frontend and go backend to do rollbacks of helm releases without necessarily the user having production access.

To dev on frontend, you want to run npm/yarn start in `build/react-frontend`

`make build-frontend` will build a production-ready copy of this into the `web/react-frontend` folder (gitignored)

`docker build -f ./build/package/Dockerfile` builds a docker image

Listens on port `8080`

Requires a client-id and client-secret from google to allow logins.  These are provided by the env vars `HELM_ROLLBACK_WEB_GCP_CLIENT_ID` and `HELM_ROLLBACK_WEB_GCP_CLIENT_SECRET`.

Helm command is configurable but defaults to `helm`, env var is `HELM_ROLLBACK_WEB_HELM_COMMAND`

## TODO:

- Security Groups (right now, basic "are you forto" only.)
- Stream the helm command output
- Neaten frontend
- Add service account

## License

GPLv2 or Later.
