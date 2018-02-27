create postgress container
--------------------------

`$ docker run --name stox-bc-rm-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcrm -d -p 5434:5432 postgres`
