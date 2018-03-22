FROM postgres:10.3

# update the repository sources list
# and install dependencies
RUN apt-get update \
    && apt-get install -y curl \
    && apt-get -y autoclean
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash

RUN apt-get install -y nodejs
RUN apt-get install -y git
RUN apt-get install -y dos2unix

# confirm installation
RUN node -v
RUN npm -v

# server is needed for update-db-schema.js
COPY stox-server /usr/stox-server

# copy the initialization script specifically, and fix line-endings
COPY stox-server/scripts/postgres-image-init.sh /docker-entrypoint-initdb.d
RUN dos2unix /docker-entrypoint-initdb.d/postgres-image-init.sh

# install server
WORKDIR /usr/stox-server
RUN npm install && npm install bcrypt