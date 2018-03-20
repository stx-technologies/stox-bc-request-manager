#!/usr/bin/env bash

IMG=$1

docker build -t $IMG --build-arg DIR=$IMG .

! docker rm -f $IMG

docker run \
        --name $IMG\
        -e PORT=$PORT\
        --env-file=./$IMG/.env\
        -p $PORT:$PORT\
        --restart unless-stopped\
        -d \
        $IMG

docker logs $IMG

