FROM node:24-bookworm-slim AS node

FROM jenkins/jenkins:lts-jdk21

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/*

COPY --from=node /usr/local/ /usr/local/

RUN npm install --global pnpm@11.17.0 \
  && node --version \
  && pnpm --version

USER jenkins

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
