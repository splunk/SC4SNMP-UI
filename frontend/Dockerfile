# The bundle is architecture-independent, so build it once on the build platform.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build-step
WORKDIR /frontend
ENV PATH=/frontend/node_modules/.bin:$PATH
COPY package.json yarn.lock lerna.json ./
COPY ./packages ./packages
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
RUN yarn install --frozen-lockfile
RUN yarn run build

FROM nginxinc/nginx-unprivileged:1.30.6-alpine
COPY --from=build-step /frontend/packages/manager/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf.template nginx/security-headers.conf /etc/nginx/sc4snmp/
COPY --chmod=755 nginx/entrypoint.sh /usr/local/bin/sc4snmp-entrypoint.sh

ENV DEMO_PORT=8080 \
    BACKEND_URL=http://ui-backend-entrypoint:5000
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/sc4snmp-entrypoint.sh"]
CMD []
