FROM node:8.9.1

ENV PORT=3771
ENV NODE_ENV=production


RUN mkdir /root/.ssh/

ADD id_rsa /root/.ssh/id_rsa

#RUN chmod 400 /root/.ssh/id_rsa
#RUN chown -R root:root /root/.ssh
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

#
#RUN mkdir -p /root/.ssh && ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts
#
#COPY ./id_rsa ./id_rsa_bitbucket_pub

RUN git clone git@bitbucket.org:stx_site/stox-bc-request-manager.git

#RUN npm install && npm install -g gulp && rm -rf $id_rsa

#COPY . $app_dir
#RUN rm -rf $app_dir/id_rsa












ENV id_rsa ./id_rsa_bitbucket_pub
ADD id_rsa $id_rsa
RUN apk add --update git openssh-client && rm -rf /tmp/* /var/cache/apk/* && mkdir -p /root/.ssh && ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts

#RUN mkdir /root/.ssh/
#ADD id_rsa_bitbucket_pub /root/.ssh/id_rsa
#RUN chmod 400 /root/.ssh/id_rsa
#RUN chown -R root:root /root/.ssh
#RUN touch /root/.ssh/known_hosts
#RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts
RUN git clone git@bitbucket.org:stx_site/stox-bc-request-manager.git

#EXPOSE $PORT

#ARG DIR
#ENV DIR $DIR

#RUN mkdir -p $DIR
##COPY ./$DIR ./$DIR
#COPY $DIR/package.json ./$DIR/
#RUN npm install --prefix $DIR/
#
#RUN mkdir -p common
##COPY ./common ./common
#COPY common/package.json ./common/
#RUN npm install --prefix common/

WORKDIR $DIR

ENTRYPOINT [ "npm", "start"]

