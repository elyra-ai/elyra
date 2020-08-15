FROM quay.io/odh-jupyterhub/s2i-minimal-notebook:3.6

COPY .profile /opt/app-root/src/
COPY requirements-elyra.txt requirements-elyra.txt

# Elyra requires nodejs v12+
RUN wget https://nodejs.org/dist/v12.18.3/node-v12.18.3-linux-x64.tar.xz && \
    tar -xvf node-v12.18.3-linux-x64.tar.xz && \
    rm -rf node-v12.18.3-linux-x64.tar.xz
RUN source /opt/app-root/src/.profile && npm install --global yarn

RUN pip install -r requirements-elyra.txt

#RUN pip install elyra==1.0.0
#RUN source /opt/app-root/src/.profile && jupyter lab build

COPY start-singleuser.sh setup-elyra-metadata.sh /opt/app-root/bin/

################## TEMP - FOR TESTING PURPOSES ######################
USER root
RUN mv /opt/rh/rh-nodejs10/root/usr/bin/node /opt/rh/rh-nodejs10/root/usr/bin/node.bak
USER default

RUN git clone --single-branch --branch odh-support https://github.com/akchinSTC/elyra-1
RUN cd elyra-1 && source /opt/app-root/src/.profile && make install

RUN git clone --single-branch --branch odh-support https://github.com/akchinSTC/kfp-notebook && \
    pip install Pygments==2.5.1
RUN cd kfp-notebook && source /opt/app-root/src/.profile && make install

USER root
RUN mv /opt/rh/rh-nodejs10/root/usr/bin/node.bak /opt/rh/rh-nodejs10/root/usr/bin/node
USER default
#####################################################################

USER root
RUN chmod 775 /opt/app-root/bin/start-singleuser.sh && \
    chown default:root /opt/app-root/bin/start-singleuser.sh

RUN chmod 775 /opt/app-root/bin/setup-elyra-metadata.sh && \
    chown default:root /opt/app-root/bin/setup-elyra-metadata.sh

USER default

RUN fix-permissions /opt/app-root