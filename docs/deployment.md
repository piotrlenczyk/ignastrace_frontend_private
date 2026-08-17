# Deployment

The application is deployed using Docker. The Dockerfile can be found here: [Dockerfile](../Dockerfile).

The NextJS build process will be run in the Dockerfile and all public credentials will be included in the static bundle.
For this reason, the Docker image build process will fail if any of the required environment variables are not set.

The following environment variables are required at build time. They will be made available to the running process too:

- `NEXT_PUBLIC_API_URL`: The URL of the backend API.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: The Google Maps API key.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: The Stripe publishable key.
- `NEXT_PUBLIC_LEMON_STRIPE_PUBLISHABLE_KEY`: The Lemon company Stripe publishable key.
- `NEXT_PUBLIC_USE_LEMON_STRIPE`: Use the Lemon company's Stripe boolean flag.
- `NEXT_PUBLIC_GTM_ID`: The Google Tag Manager ID.
- `NEXT_PUBLIC_APP_URL`: The URL of the frontend application.
- `NEXT_PUBLIC_REQUEST_ZIP`: Set to `true` to enable requesting the ZIP code for selected countries (check `const COUNTRIES_REQUESTING_ZIP`).
- `ENABLE_UPSELLS`: Set to `true` to make upsells accessible after a subscription.
- `_LOOKUP`: Set to `true` to make reverse lookup accessible.

There are some additional runtime environment variables required when running the application containers:

- `SESSION_PASSWORD`: The secret the session cookie is sealed with. Any random string of at least 32 characters. Rotating it invalidates every existing session, signing everyone out.
- `API_BASE_URL`: The base URL of the API that issues the session's access and refresh tokens, e.g. `https://api.ignastrace.io`.
- `IPSTACK_API_KEY`: The Ipstack API key.
- `INTERNAL_API_URL`: The URL for the backend API that uses the internal container host. If this is not set, the NEXT_PUBLIC_API_URL will be used.
- `PDF_GENERATION_APP_HOST`: This is the HOST that will be requested to generate the PDF. In this host the app needs to be running. Usually this will be http://localhost:3000.

Those are private credentials and won't be included in the static bundle.
