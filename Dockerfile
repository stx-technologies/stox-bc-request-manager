FROM node:8.9.1

ENV PORT=3771

ENV NODE_ENV=production

RUN mkdir /root/.ssh/

COPY ./id_rsa_bitbucket /root/.ssh/id_rsa

RUN chmod 400 /root/.ssh/id_rsa
RUN chown -R root:root /root/.ssh
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

RUN git clone git@bitbucket.org:stx_site/stox-bc-request-manager.git

#RUN npm install && rm -rf /root/.ssh/id_rsa
RUN npm install

#WORKDIR $DIR

ENTRYPOINT [ "npm", "start"]

