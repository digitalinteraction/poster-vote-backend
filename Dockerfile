# [0] A common base for both stages
FROM node:10-alpine as base
WORKDIR /app
COPY ["package.json", "package-lock.json", "tsconfig.json", "/app/"]

# [1] A builder to install modules and run a build
# (installs production deps., clones them then installs dev)
FROM base as builder
ENV NODE_ENV development
RUN npm ci > /dev/null
COPY src /app/src
RUN npm run build -s

# [2] Run tests
FROM builder as tester
ENV NODE_ENV testing
COPY spec /app/spec
RUN npm test -s > /dev/null

# [3] From the base, copy the dist/ and production node modules in and start
FROM builder as dist
ENV NODE_ENV production
RUN npm prune
VOLUME /app/uploads
CMD [ "npm", "start", "-s" ]
