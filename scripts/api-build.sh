#!/bin/bash

SWAGGER_API_JSON_OUTPUT_FILE='./src/network/api/api.json'
SWAGGER_API_JSON_TYPES_FILE='./src/network/api/api.d.ts'
SWAGGER_API_PATHS_FILE='./src/network/api/api-paths.ts'

npx openapi-typescript $SWAGGER_API_JSON_OUTPUT_FILE -o $SWAGGER_API_JSON_TYPES_FILE
npx eslint --fix $SWAGGER_API_JSON_TYPES_FILE
npx prettier $SWAGGER_API_JSON_TYPES_FILE --write

# The same specification, as the runtime allow-list the proxy route checks against.
# It formats its own output, so a regeneration never produces a whitespace-only diff.
node scripts/generate-api-paths.mjs --input $SWAGGER_API_JSON_OUTPUT_FILE --output $SWAGGER_API_PATHS_FILE
