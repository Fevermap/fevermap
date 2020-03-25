# This Dockerfile is only meant for local development, not production use.
FROM ypcs/debian:buster

ENV APPDIR /app

RUN /usr/lib/docker-helpers/apt-setup && \
    /usr/lib/docker-helpers/apt-upgrade && \
    apt-get --assume-yes install \
        entr \
        procps \
        rsync \
        nodejs \
        npm \
        webpack && \
    /usr/lib/docker-helpers/apt-cleanup

# Ensure npm is of latest version
RUN npm i npm@latest -g

# Pre-install the node_modules into the container for fast later use
COPY package.json /tmp
COPY package-lock.json /tmp
RUN cd /tmp && npm install

# Environment to start with
WORKDIR $APPDIR
ENTRYPOINT ["/app/entrypoint.sh"]
