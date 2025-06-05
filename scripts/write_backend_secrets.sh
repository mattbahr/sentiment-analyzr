#!/bin/bash

mkdir ./backend/secrets
echo "$OPENAI_API_KEY" > ./backend/secrets/openai_api_key