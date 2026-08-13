#!/bin/bash

SWAGGER_API_JSON_OUTPUT_FILE='./src/network/api/api.json'
SWAGGER_API_JSON_TYPES_FILE='./src/network/api/api.d.ts'

npx openapi-typescript $SWAGGER_API_JSON_OUTPUT_FILE -o $SWAGGER_API_JSON_TYPES_FILE
npx eslint --fix $SWAGGER_API_JSON_TYPES_FILE
npx prettier $SWAGGER_API_JSON_TYPES_FILE --write
