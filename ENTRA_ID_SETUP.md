# Microsoft Entra ID Setup

Use a normal Microsoft Entra tenant in your Azure free account. You do not need paid Azure services for this.

## In Microsoft Entra admin center

1. Open `Microsoft Entra admin center` at `https://entra.microsoft.com/`.
2. Go to `Entra ID -> App registrations -> New registration`.
3. Name: `kc-sso-poc-keycloak`.
4. Supported account types: `Single tenant`.
5. Redirect URI:
   - Platform: `Web`
   - URI: `https://kc-sso-demo.krasisoft.com/realms/kc-sso-poc/broker/entra/endpoint`
6. After creation, copy:
   - `Application (client) ID`
   - `Directory (tenant) ID`
7. Go to `Certificates & secrets -> New client secret` and copy the secret value.
8. Go to `Authentication` and confirm the Web redirect URI is present.

## In this repo

1. Open [keycloak/realm/kc-sso-poc-realm.json](/Users/zivero/dev/3rd/kc-sso-poc/keycloak/realm/kc-sso-poc-realm.json:1).
2. In `identityProviders[0]`, replace:
   - `REPLACE_WITH_TENANT_ID`
   - `REPLACE_WITH_ENTRA_CLIENT_ID`
   - `REPLACE_WITH_ENTRA_CLIENT_SECRET`
3. Change `"enabled": false` to `"enabled": true`.
4. Rebuild and recreate Keycloak:

```bash
docker compose down --volumes
docker compose up -d --build
```

## Test

1. Open `https://app1-sso-demo.krasisoft.com/`.
2. On the Keycloak login page, use `Microsoft Entra ID`.
3. Sign in with a user from the same Entra tenant.
4. Open `https://app2-sso-demo.krasisoft.com/` in the same browser session.
5. Confirm Keycloak does not ask for credentials again.
