# Request Manager

The Request Manager holds the data of all pending and confirmed requests related to the
blockchain. It acts as a manager service that sends and tracks the status of requests across all
microservices and handles their resolution process.

## Setup
install global packages
```
npm install lerna rimraf cross-env -g
```
Installs all of the packages dependencies and links any cross-dependencies
```
npm run setup
```
Remove all node_modules directories from all packages and run setup
```
npm run setup:clean
```
run lint for all packages
```
npm run lint
```
link stox-common package to all services
```
npm run link
```

##Build
To build a base image for a service you will need an id_rsa located at the root of the repository
```
docker build --no-cache -f ./docker/Dockerfile -t request-manager --build-arg SSH_PRIVATE_KEY="$(cat ./id_rsa)" .
```
To build database and activemq images, run the command:
```
npm run containers
```

## Tests
To run docker-compose tests first build the base image and then run:
```
npm run test --request-manager:service=<service_name>
```

eg. to test common run:

```
npm run test --request-manager:service=common 
```

default service to test is request-handler.


## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)
