# Request Manager

## Description
The Request Manager holds the data of all pending and confirmed requests related to the
blockchain. It acts as a manager service that sends and tracks the status of requests across all
microservices and handles their resolution process.

## Getting Started

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
docker build -f db.Dockerfile -t stox-postgres-bc-rm .
docker run --name stox-postgres-bc-rm -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcrm -d -p 5434:5432 stox-postgres-bc-rm
```

### Active MQ
```
$ docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq
```
[Apache ActiveMQ Console](http://localhost:8161)

## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)
