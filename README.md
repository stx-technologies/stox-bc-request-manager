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

To build subsystem base image, data base image and activemq, run the command:

```
npm run containers:build
```

## Run
Run Active MQ and Postgress database containers
```
npm run containers:up
```


## Tests
To run docker-compose tests first build the base image and then run:
```
npm run test
```



## Docs
[Blockchain Writer Architecture](https://docs.google.com/document/d/1eXrxDFgjDl-2No22om8vesqGhU7iGtw8iDSuN3VoHJ4/edit#heading=h.jsy3plhn9pv8)
