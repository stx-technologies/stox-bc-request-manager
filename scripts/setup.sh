#!/usr/bin/env bash
apk add --no-cache nodejs openssh py-pip alpine-sdk;
npm install lerna rimraf cross-env env-cmd -g;
set -eu
pip install --no-cache-dir docker-compose
npm run setup
