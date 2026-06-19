# kc-sso-poc

Bootstrap for a Keycloak-backed SSO proof of concept with two mirrored Angular todo apps, nginx protection in front of static files, and Node.js resource servers that validate Keycloak JWTs.

## Included

- `docker-compose.yml` with Keycloak, two oauth2-proxy instances, two Node.js backends, and nginx
- `keycloak/Dockerfile` to bake the realm import into the Keycloak image
- `nginx/Dockerfile` to build both Angular apps and bake the static assets into the nginx image
- `.env.example` for admin/bootstrap settings
- `keycloak/realm/kc-sso-poc-realm.json` starter realm import
- `nginx/default.conf` protecting static content and API calls through `auth_request`
- `apps/app1` and `apps/app2` mirrored Angular todo apps
- `apps/backend` minimal dependency-free Node.js API used by both apps
- `ENTRA_ID_SETUP.md` minimal Microsoft Entra ID setup steps

The Angular projects target Angular `^22.0.0`, which is the active Angular major version in the official release table as of June 19, 2026.

## Suggested minimal shape

The simplest way to make the demo visible is to keep tokens out of the Angular code:

- nginx protects every static Angular file with `auth_request`.
- oauth2-proxy handles the browser OIDC flow and redirects to Keycloak.
- nginx forwards oauth2-proxy's access token only to `/api`.
- the Node.js backend validates the JWT signature, issuer, audience, and expiry against Keycloak JWKS.

That proves frontend static-file protection and backend resource-server validation without adding a Keycloak JavaScript adapter or storing tokens in browser storage.

## Bootstrap steps

1. Copy `.env.example` to `.env`.
2. Adjust the admin password, the demo client secret, and the oauth2-proxy cookie secret.
3. Put the Cloudflare Origin Certificate files on the Docker host:

```text
.certs/cloudflare-origin.pem
.certs/cloudflare-origin.key
```

4. Point DNS at the Docker host:
    - `kc-sso-demo.krasisoft.com`
    - `app1-sso-demo.krasisoft.com`
    - `app2-sso-demo.krasisoft.com`
5. In Cloudflare, proxy the DNS records and use SSL/TLS mode `Full (strict)` for these hostnames.
6. Start the stack when you are ready:

```bash
docker compose up -d --build
```

If you previously exported local values such as `KEYCLOAK_PUBLIC_URL`, unset them first. Docker Compose gives shell variables precedence over `.env`.

## Notes

- The realm import creates:
    - realm: `kc-sso-poc`
    - client: `frontend`
    - realm role: `app_user`
    - demo user: `demo.user`
- nginx serves protected Angular apps on:
    - `https://app1-sso-demo.krasisoft.com/`
    - `https://app2-sso-demo.krasisoft.com/`
- nginx proxies Keycloak on `https://kc-sso-demo.krasisoft.com/`.
- Keycloak is not published directly on a host port; public access goes through nginx.
- oauth2-proxy handles the OIDC login flow against Keycloak and nginx enforces authentication before serving static Angular files or proxying API calls.
- App data is stored in backend memory and is lost when the backend container restarts.
- No local bind mounts are used. The compose setup is packaged as build contexts, which fits a remote Docker host better.
- The nginx container terminates TLS with the Cloudflare Origin Certificate mounted from `.certs/`.
- oauth2-proxy uses the public `https://kc-sso-demo.krasisoft.com` issuer URL. With proxied Cloudflare DNS, it validates Cloudflare's public edge certificate instead of the private Origin Certificate.
- Microsoft Entra ID federation scaffolding is included in the realm import but is disabled until you add your tenant-specific values.
- The imported `frontend` client is configured as a confidential client for `oauth2-proxy`; do not require PKCE on that client unless your proxy is explicitly configured to send PKCE parameters.

## Manual test

- Make sure all three `*.krasisoft.com` names resolve to the Docker host from your browser machine.
- Make sure ports `80` and `443` reach the nginx container.
- Start the stack with `docker compose up -d --build`.
- Wait until `docker compose ps` shows `keycloak`, both `oauth2-proxy` containers, both backend containers, and `nginx` as running.
- Open `https://app1-sso-demo.krasisoft.com/`.
- Confirm you are redirected to Keycloak instead of seeing the page immediately.
- Sign in with:
    - username: `demo.user`
    - password: `ChangeMe123!`
- Confirm you are redirected back to App 1 and can add a todo.
- Open `https://app2-sso-demo.krasisoft.com/` in the same browser session.
- Confirm you may briefly pass through Keycloak but are not prompted for credentials again, then can add a separate App 2 todo.
- Open a private/incognito window and confirm `https://app1-sso-demo.krasisoft.com/` requires login again.
- Optional: open `https://kc-sso-demo.krasisoft.com/realms/kc-sso-poc/.well-known/openid-configuration` and confirm Keycloak responds.

## Local host fallback

For a local-only smoke test, map these hostnames to your Docker host in `/etc/hosts` and keep `NGINX_HTTP_PORT=80` plus `NGINX_HTTPS_PORT=443`:

```text
127.0.0.1 kc-sso-demo.krasisoft.com app1-sso-demo.krasisoft.com app2-sso-demo.krasisoft.com
```

Because this setup uses a Cloudflare Origin Certificate, direct local browser access may show a certificate warning unless the request goes through Cloudflare.

## Troubleshooting

- If Keycloak redirects back with `error=invalid_request` and `Missing parameter: code_challenge_method`, the `frontend` client in Keycloak is requiring PKCE. Remove that requirement in Keycloak or recreate the local Keycloak data volume so the realm import is applied again.
- If App 1 works but App 2 asks for credentials again, check that both apps use the same Keycloak realm and that your browser accepts cookies for `kc-sso-demo.krasisoft.com`.
