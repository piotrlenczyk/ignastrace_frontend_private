#!/bin/bash

source .env

SWAGGER_API_JSON_OUTPUT_FILE='./src/network/api/api.json'

# Curl command to fetch JSON
curl -u "$SWAGGER_USERNAME:$SWAGGER_PASSWORD" \
     -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
     -H "Accept: application/json" \
     "$SWAGGER_API_JSON_URL" -o "$SWAGGER_API_JSON_OUTPUT_FILE"

# Check if the file was saved successfully
npx prettier --write "$SWAGGER_API_JSON_OUTPUT_FILE"
