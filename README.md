# Request Manager

## Description
The Request Manager holds the data of all pending and confirmed requests related to the
blockchain. It acts as a manager service that sends and tracks the status of requests across all
microservices and handles their resolution process.

## Getting Started

`npm install lerna rimraf cross-env -g`

install global packages

```npm run setup```

Installs all of the packages dependencies and links any cross-dependencies.

```npm run setup:clean```

Remove the node_modules directory from all packages and run setup

```$ npm run lint```

run lint for all packages

`$ ./common.sh link`

link stox-common package to all services

## Containers

### Postgress
```
docker build -f ./docker/db.Dockerfile -t stox-postgres-bc-rm .
docker run --name stox-postgres-bc-rm -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcrm -d -p 5434:5432 stox-postgres-bc-rm
```

### Active MQ
```
docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq
```
[Apache ActiveMQ Console](http://localhost:8161)

## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)

## Docker build
To build a base image for a service you will need an id_rsa located at the root of the repository.
```
docker build --no-cache -f ./docker/Dockerfile -t request-manager --build-arg SSH_PRIVATE_KEY="$(cat ./id_rsa)" .
```

## Docker Compose build and run
```
cross-env SERVICE_NAME=request-handler docker-compose -f docker/docker-compose.yml up -d
cross-env SERVICE_NAME=request-manager-api docker-compose -f docker/docker-compose.yml up -d
cross-env SERVICE_NAME=request-reader docker-compose -f docker/docker-compose.yml up -d
```

## Tests
To test a service run the command: ``` npm run test  ``` 
in the service directory. Please notice if the test needs a data base 
or a queue before running the it. For the pact test to pass you need to
have the same port (3001) as your http service to mock it.
