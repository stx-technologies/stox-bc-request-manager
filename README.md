#Request Manager


## Description
The Request Manager holds the data of all pending and confirmed requests related to the
blockchain. It acts as a manager service that sends and tracks the status of requests across all
microservices and handles their resolution process.

## Services

**request-handler**
Reads all pending requests from the database, and uses the appropriate request plugin to
prepare transactions according to the request type by calling the “prepareTransactions” function
on the plugin.

**request-reader**
Reads incoming requests from a dedicated queue and writes them to the Requests table.

**transactions-monitor**
Reads all sent transactions requests from the database and checks the parity node for the
transaction status (Success / Fail). The transaction monitor updates the transaction status in the
db and calls the appropriate request handler plugin “onTransactionFinished” function. If the
plugin returns that the request is finished (either fail or success) The transactions monitor
publish the request + transaction to a queue to notify other subsystems about it.

**transactions-writer**
Reads all pending transactions from the database, it prepares them (with the help of the
Blockchain Signer and the Gas Calculator), and sends it to the Parity Node.


## Queues

**Incoming Requests​**

Listen to incoming requests and writes them to the database

**Completed Requests​**

Send completed requests (either failed or successful) to this
queue, so other subsystems can handle process the results if needed.


## Docker containers
**Postgress database**

`$ docker run --name stox-bc-rm-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcrm -d -p 5434:5432 postgres`

`$ docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq`


## install

`$ ./install.sh`

run npm install in all packages

`$ ./install.sh clean`

delete node_modules and package_lock.json before installing
