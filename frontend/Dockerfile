FROM node:20.12.0-alpine as build-step
WORKDIR /frontend
ENV PATH /frontend/node_modules/.bin:$PATH
COPY package.json yarn.lock lerna.json ./
COPY ./packages ./packages
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
RUN yarn install
RUN yarn run build
RUN apk add curl
WORKDIR /frontend/packages/manager
EXPOSE 8080
CMD ["yarn", "run", "start:demo"]
