FROM postgres:10.3

COPY common/src/db/init_script.sql /docker-entrypoint-initdb.d
