FROM node:8.9.1

ENV PORT=3771
ENV NODE_ENV=production
ENV DATABASE_URL=postgres://NO_SUCH_DB

EXPOSE $PORT

ARG DIR
ENV DIR $DIR

COPY ./id_rsa_stox /root/.ssh/id_rsa
RUN chmod 400 /root/.ssh/id_rsa
RUN chown -R root:root /root/.ssh
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

RUN mkdir -p $DIR
RUN mkdir -p common

#RUN npm i -g nodemon

COPY ./common ./common
COPY ./$DIR ./$DIR

RUN rm -rf ./common/node_modules
RUN rm -rf ./$DIR/node_modules
RUN rm -rf ./$DIR/.env

RUN npm install --prefix common/
RUN npm install --prefix $DIR/


WORKDIR $DIR

ENTRYPOINT [ "npm", "run", "serve"]

