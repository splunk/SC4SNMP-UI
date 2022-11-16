FROM node:16-alpine as build-step
WORKDIR /frontend
ENV PATH /frontend/node_modules/.bin:$PATH
COPY package.json yarn.lock lerna.json ./
COPY ./packages ./packages
RUN yarn install
RUN yarn run build
RUN apk add curl
WORKDIR /frontend/packages/manager
EXPOSE 8080
CMD ["yarn", "run", "start:demo"]
