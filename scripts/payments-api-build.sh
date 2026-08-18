#!/bin/bash

# Rebuilds the Payments API's types and published-path list from the fetched specification.
#
# The counterpart of scripts/api-build.sh, kept as a separate script rather than a parameterised
# one: the path-list generator hard-codes both the types module it imports and the name of the
# constant it exports, so there is nothing to share without rewriting the API's generation path.
#
# It stops on the first failure, because the types and the path list are generated from the same
# document and a half-finished run is exactly the drift the cross-check exists to catch.

set -euo pipefail

PAYMENTS_API_JSON_FILE='./src/network/payments-api/payments-api.json'
PAYMENTS_API_JSON_TYPES_FILE='./src/network/payments-api/payments-api.d.ts'
PAYMENTS_API_PATHS_FILE='./src/network/payments-api/payments-api-paths.ts'

npx openapi-typescript "$PAYMENTS_API_JSON_FILE" -o "$PAYMENTS_API_JSON_TYPES_FILE"

# Cosmetic, and on generated output: a rule this repository cannot fix in a file it does not
# write must not be what stops the regeneration.
npx eslint --fix "$PAYMENTS_API_JSON_TYPES_FILE" || true
npx prettier "$PAYMENTS_API_JSON_TYPES_FILE" --write

# The same specification, as the runtime allow-list the payments proxy route checks against.
# It formats its own output, so a regeneration never produces a whitespace-only diff.
node scripts/generate-payments-api-paths.mjs --input "$PAYMENTS_API_JSON_FILE" --output "$PAYMENTS_API_PATHS_FILE"
