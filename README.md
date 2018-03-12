create containers
-----------------

`$ docker run --name stox-bc-rm-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcrm -d -p 5435:5432 postgres`

`$ docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq`


install
-----------------

run npm install and link common package to all services packages

`$ ./install.sh`

delete node_modules and package_lock.json before installing

`$ ./install.sh clean`
