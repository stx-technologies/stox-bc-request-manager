#!/usr/bin/env bash
docker build -f ./docker/Dockerfile -t $IMAGE_NAME --build-arg SSH_PRIVATE_KEY="$(cat /opt/atlassian/pipelines/agent/data/id_rsa)" .
