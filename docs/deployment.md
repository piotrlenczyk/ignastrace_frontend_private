# Deployment

The application is deployed using Docker. The Dockerfile can be found here: [Dockerfile](../Dockerfile).

The NextJS build process will be run in the Dockerfile and all public credentials will be included in the static bundle.
For this reason, the Docker image build process will fail if any of the required environment variables are not set.

The following environment variables are required at build time. They will be made available to the running process too:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: The Google Maps API key.
- `NEXT_PUBLIC_GTM_ID`: The Google Tag Manager ID.
- `NEXT_PUBLIC_APP_URL`: The URL of the frontend application.
- `NEXT_PUBLIC_REQUEST_ZIP`: Set to `true` to enable requesting the ZIP code for selected countries (check `const COUNTRIES_REQUESTING_ZIP`).
- `ENABLE_UPSELLS`: Set to `true` to make upsells accessible after a subscription.
- `_LOOKUP`: Set to `true` to make reverse lookup accessible.

There are some additional runtime environment variables required when running the application containers:

- `SESSION_PASSWORD`: The secret the session cookie is sealed with. Any random string of at least 32 characters. Rotating it invalidates every existing session, signing everyone out.
- `API_BASE_URL`: The base URL of the API that issues the session's access and refresh tokens, e.g. `https://api.ignastrace.io`.
- `PAYMENTS_API_BASE_URL`: The base URL of the Payments microservice, prefix included, e.g. `https://dev.resumewise.com/api/payments/v1`. The specification declares its paths bare and keeps the prefix in its `servers` field, so the prefix belongs here. TEMPORARY: the resumewise development instance is the only payments instance that answers today.
- `PAYMENTS_API_TOKEN_REFRESH_URL`: The full URL the payments credential is renewed at, host and path together, e.g. `https://dev.resumewise.com/api/payments/v1/auth/refresh-token`. TEMPORARY: it exists only while the payments credential is a shared technical account's — see `docs/adr/0023-a-shared-technical-account-for-the-payments-upstream.md`.
- `PAYMENTS_API_SEED_REFRESH_TOKEN`: The refresh token of that technical account, used to obtain the first payments access token; the rotated one lives in the session from then on. A secret. TEMPORARY, with the variable above — leave both unset and payments calls simply go out unauthenticated, which refuses everything user-facing that upstream protects.
- `IPSTACK_API_KEY`: The Ipstack API key.
- `PDF_GENERATION_APP_HOST`: This is the HOST that will be requested to generate the PDF. In this host the app needs to be running. Usually this will be http://localhost:3000.

Those are private credentials and won't be included in the static bundle.
