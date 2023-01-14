FROM node:16-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apk add --no-cache \
      chromium \
      git \
      nss \
      freetype \
      freetype-dev \
      harfbuzz \
      ca-certificates \
      ttf-freefont

COPY ./package.json .
COPY ./yarn.lock .

# Install shieldy dependencies
RUN yarn install \
 && yarn cache clean

COPY ./tsconfig.json .
COPY ./scripts ./scripts
COPY ./l10n ./l10n
COPY ./src ./src
COPY ./entrypoint.sh .

ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

CMD ["./entrypoint.sh"]
