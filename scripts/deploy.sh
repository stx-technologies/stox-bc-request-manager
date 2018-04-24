#!/usr/bin/env bash
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip -d /tmp/
/tmp/awscli-bundle/install -b ~/bin/aws
export PATH=~/bin:$PATH
eval $(aws ecr get-login --no-include-email --region ${AWS_DEFAULT_REGION})
docker push $IMAGE_NAME
