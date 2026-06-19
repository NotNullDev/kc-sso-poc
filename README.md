# Demo apps

- https://app1-sso-demo.krasisoft.com/
- https://app2-sso-demo.krasisoft.com/

## Credentials for demo user

- username: demo.user
- password: demo

# Static files protection

```shell
# won't show css - instead will respond with 302 and html containing only link to keycloak
curl https://app1-sso-demo.krasisoft.com/styles-KCFV5C5F.css
```