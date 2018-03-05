create containers
-----------------

`$ docker run --name stox-bc-rm-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=stoxbcrm -d -p 5434:5432 postgres`

`$ docker run -p 61613:61613 -p 8161:8161 -d --name="activemq" rmohr/activemq`

use npm link to link common with all services.
