FROM postgres:10.3

COPY packages/common/initdb/ /docker-entrypoint-initdb.d
