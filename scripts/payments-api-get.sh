#!/bin/bash

# Fetches the Payments API's specification into the repository.
#
# Deliberately separate from scripts/api-get.sh — the two upstreams share no host, no
# credentials and no output file, and regenerating one specification must never produce a diff
# in the other.
#
# The payments host answers without Cloudflare Access and without basic authentication, and this
# repository holds no such credentials for it, so this fetch sends none.

set -euo pipefail

# The variable may equally come from the environment, so a missing .env is not a failure — an
# unset PAYMENTS_API_BASE_URL is, and it is reported below rather than as a bash error.
if [ -f .env ]; then
  source .env
fi

PAYMENTS_API_JSON_FILE='./src/network/payments-api/payments-api.json'

if [ -z "${PAYMENTS_API_BASE_URL:-}" ]; then
  echo 'PAYMENTS_API_BASE_URL is not set — see .env.example.' >&2
  exit 1
fi

# Written aside and moved into place only once the fetch has succeeded: curl truncates its
# output file before it knows the response's status, and losing the committed specification to a
# 500 would leave a checkout unable to build.
PAYMENTS_API_JSON_DOWNLOAD="$(mktemp)"
trap 'rm -f "$PAYMENTS_API_JSON_DOWNLOAD"' EXIT

# The service serves its specification under the same versioned base a call goes to, so the one
# variable that names the host names the document too.
curl -fsS \
     -H "Accept: application/json" \
     "$PAYMENTS_API_BASE_URL/docs/json" -o "$PAYMENTS_API_JSON_DOWNLOAD"

mkdir -p "$(dirname "$PAYMENTS_API_JSON_FILE")"
mv "$PAYMENTS_API_JSON_DOWNLOAD" "$PAYMENTS_API_JSON_FILE"

npx prettier --write "$PAYMENTS_API_JSON_FILE"
