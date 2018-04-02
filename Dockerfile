FROM node:8.9.1

ENV NODE_ENV=production

ARG SSH_PRIVATE_KEY
ENV SERVICE_NAME ''

RUN npm i -g lerna

RUN mkdir /root/.ssh/
RUN echo "${SSH_PRIVATE_KEY}" > /root/.ssh/id_rsa
RUN chmod 400 /root/.ssh/id_rsa
RUN chown -R root:root /root/.ssh
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

RUN mkdir services
COPY ./ ./services

WORKDIR ./services

RUN npm run setup:clean

CMD npm run serve --prefix packages/$SERVICE_NAME

