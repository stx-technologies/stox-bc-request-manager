FROM node:8.9.1

ENV NODE_ENV=production

ARG DIR
ENV DIR $DIR

COPY ./deploy/id_rsa_bitbucket /root/.ssh/id_rsa
RUN chmod 400 /root/.ssh/id_rsa
RUN chown -R root:root /root/.ssh
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

RUN mkdir -p common
COPY ./common ./common
RUN rm -rf ./common/node_modules
RUN npm install --prefix common/

RUN mkdir -p $DIR
COPY ./$DIR ./$DIR
RUN rm -rf ./$DIR/node_modules
RUN rm -rf ./$DIR/.env
RUN rm -rf ./$DIR/package-lock.json
RUN npm install --prefix $DIR/

WORKDIR $DIR

ENTRYPOINT [ "npm", "run", "serve"]
