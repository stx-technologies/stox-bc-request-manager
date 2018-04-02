FROM postgres:10.3

COPY packages/common/src/db/init_script.sql /docker-entrypoint-initdb.d
