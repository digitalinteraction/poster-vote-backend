# [0] A common base for both stages
FROM node:11-alpine as base
WORKDIR /app
COPY ["package.json", "package-lock.json", "tsconfig.json", "/app/"]

# [1] A builder to install modules and run a build
# (installs production deps., clones them then installs dev)
FROM base as builder
ENV NODE_ENV development
RUN npm ci
COPY src /app/src
RUN npm run build -s
COPY bin /app/bin

# [2] Run tests (sqlite3 doesn't play nicely with alpine)
# FROM builder as tester
# ENV NODE_ENV testing
# RUN npm test -s

# [3] From the base, copy the dist/ and production node modules in and start
FROM builder as dist
COPY --from=openlab/fsk /usr/bin/fsk /usr/bin/fsk
COPY views /app/views
COPY static /app/static
ENV NODE_ENV production
RUN npm ci
VOLUME /app/uploads
CMD [ "npm", "start", "-s" ]
