# PosterVote backend

This is the repo for the PosterVote backend source code.
It is an [Express](https://expressjs.com/) server written in [TypeScript](https://www.typescriptlang.org/) and deployed through [Docker](https://www.docker.com/).
It connects to a [MySQL](https://www.mysql.com/) database and uses migrations to manage tables.
It also has a CLI to perform migrations and perform other useful tasks.

[What is PosterVote?](https://github.com/poster-vote/about)

## Development

### Setup

To develop on this repo, you will need to have [Docker](https://www.docker.com/get-started) and [Node](https://nodejs.org/en/) installed on your dev machine.

You will also need a [SendGrid API key](https://app.sendgrid.com/settings/api_keys) to send authentication emails.

```bash
# Install dependencies through npm
npm install

# Setup your environment, filling in the blanks
cp .env.example .env
nano .env
```

### Regular use

```bash
# Spin up a mysql database for development
#  -> Launches a mysql docker container
#  -> Access from the host with mysql://user:secret@127.0.0.1:3306/postervote
#  -> It uses a named volume so if you stop the container, the data persists
#  -> NOTE: The first time you run this you have to add a 'postervote' table
npm run mysql

# Run a development server on your machine
# -> This will watch for changes to .ts files and reload the server
# -> It will fail if any config is missing in your .env
npm run watch

# Run unit tests
#  -> It looks for files that end with '.spec.ts', e.g. MyApp.spec.ts
npm test -s
```

### Code Structure

| Folder         | Use                                                       |
| -------------- | --------------------------------------------------------- |
| bin            | Reusable commands for development, used in `package.json` |
| dist           | Where TypeScript files are transpiled to                  |
| src            | The location of the source code                           |
| src/core       | Core utilities of the server                              |
| src/migrations | Database migrations to create & replicate the database    |
| src/routes     | Api routes, routed to by express                          |
| src/views      | Pug templates for rendering html                          |
| static         | Static assets served at `/static`                         |
| uploads        | Internal uploads directory for storing files              |

### Testing

This project uses [unit tests](https://en.wikipedia.org/wiki/Unit_testing) to ensure that everything is working correctly, guide development, avoid bad code and reduce defects.
Tests are any file in `src/` that ends with `.spec.ts`, by convention they are inline with the source code,
in a parallel folder called `__tests__`.

```bash
# Run the tests
npm test -s

# Generate code coverage
npm run coverage -s
```

### Formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code when you stage changes.
This means that code that is pushed is always formatted to a consistent standard.
You can manually run the formatter with `npm run prettier`.

## Deployment

### Building the image

This project uses a [GitLab CI](https://about.gitlab.com/product/continuous-integration/) to build a Docker image when you push a git tag.
This is designed to be used with the `npm version` command so all docker images are semantically versioned.

```bash
npm version ... # major | minor | patch
git push --tags
```

### Using the image

With this docker image you can easily deploy it to your server using docker-compose.
The server uses environment variables to let you configure how it works.
Some variables are set by default when in `development` mode, below is the available configuration:

| Variable           | Description                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| NODE_ENV           | The mode the server is running in either `production` or `development`               |
| API_URL            | The url where this container is hosted, e.g. `https://api.postervote.co.uk`          |
| WEB_URL            | The url where the web counterpart is hosted                                          |
| DB_TYPE            | (optional) The type of database to conenct to, default: `mysql`                      |
| DB_URI             | The uri to access the database, e.g. `mysql://user:secret@127.0.0.1:3306/postervote` |
| JWT_SECRET         | A unique secret used to generate JWT tokens, the longer the better                   |
| COOKIE_SECRET      | A unique secret used to sign cookies, the longer the better                          |
| HASH_SECRET        | A unique secret used to hash private info with, the longer the better                |
| ADMIN_EMAIL        | The email address where login emails will come from                                  |
| SENDGRID_API_KEY   | Your [SendGrid API key](https://app.sendgrid.com/settings/api_keys)                  |
| REG_TWILIO_NUMBER  | Your Twilio phone number used to register posters                                    |
| VOTE_TWILIO_NUMBER | Your Twilio phone number used to submit votes                                        |

---

> The code on https://github.com/poster-vote/node-backend is a mirror of https://openlab.ncl.ac.uk/gitlab/poster-vote/node-backend
