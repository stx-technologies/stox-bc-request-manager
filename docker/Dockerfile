FROM node:8.9.1

ARG SSH_PRIVATE_KEY
ENV SERVICE_NAME=${SERVICE_NAME}

RUN mkdir /root/.ssh/ && \
    echo "${SSH_PRIVATE_KEY}" > /root/.ssh/id_rsa && \
    chmod 400 /root/.ssh/id_rsa && \
    chown -R root:root /root/.ssh && \
    touch /root/.ssh/known_hosts && \
    ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

RUN mkdir services
COPY ./ ./services
WORKDIR ./services

RUN npm install lerna rimraf cross-env env-cmd -g && \
    npm run setup
