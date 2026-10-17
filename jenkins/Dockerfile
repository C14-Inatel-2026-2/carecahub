FROM node:24-bookworm-slim AS node

FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules

ENV COREPACK_HOME=/usr/local/share/corepack

RUN mkdir -p "$COREPACK_HOME" \
  && ln -s ../lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack \
  && corepack enable \
  && corepack install --global pnpm@11.17.0 \
  && chown -R jenkins:jenkins "$COREPACK_HOME" \
  && node --version \
  && pnpm --version

USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
