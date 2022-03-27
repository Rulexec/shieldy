FROM node:12-alpine

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
COPY ./pnpm-lock.yaml .

# Install shieldy dependencies
RUN pnpm install

COPY ./tsconfig.json .
COPY ./scripts ./scripts
COPY ./src ./src
COPY ./entrypoint.sh .

ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

CMD ["./entrypoint.sh"]
