FROM node:8.9.1

ENV PORT=3771
ENV NODE_ENV=production
ENV DATABASE_URL=postgres://NO_SUCH_DB

EXPOSE $PORT

ARG DIR
ENV DIR $DIR

RUN echo $DIR
ENV NPM_TOKEN=00000000-0000-0000-0000-000000000000
RUN mkdir -p $DIR
RUN mkdir -p common

COPY $DIR/package.json ./$DIR/
COPY $DIR/package-lock.json ./$DIR/

COPY common/package.json ./common/
COPY common/package-lock.json ./common/

RUN npm install --prefix common/
RUN npm install --prefix $DIR/

COPY ./common ./common
COPY ./$DIR ./$DIR

WORKDIR $DIR

ENTRYPOINT [ "npm", "run", "serve"]

