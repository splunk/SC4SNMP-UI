FROM node:16-alpine as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json yarn.lock lerna.json ./
COPY ./packages ./packages
RUN yarn install
RUN yarn run build
WORKDIR /app/packages/manager
CMD ["yarn", "run", "start:demo"]
