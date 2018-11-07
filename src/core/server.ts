import * as express from 'express'
import * as routes from '../routes'
import * as Knex from 'knex'
import { Api } from 'api-formatter'
import bodyParser = require('body-parser')
import cookieParser = require('cookie-parser')
import jwtParser = require('express-jwt')
import escapeStringRegexp = require('escape-string-regexp')

import { RouteContext, Route } from 'src/types'
import { cookieName } from 'src/const'
import { Redirect, HttpError } from 'src/core/errors'
import { jwtParserConfig } from 'src/core/jwt'

const jwtConfig: jwtParser.Options = {
  secret: process.env.JWT_SECRET!,
  credentialsRequired: false,
  getToken(req) {
    let { headers = {}, signedCookies = {}, query = {} } = req

    // Try a signed cookie
    if (signedCookies[cookieName]) {
      return req.signedCookies[cookieName]
    }

    // Try an auth header, Authorization: Bearer
    if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
      return headers.authorization.split(' ')[1]
    }

    // Try the query string, ?token=
    if (query.token) return query.token
    return null
  }
}

type ErrorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void

const makeRoute = (route: Route, knex: Knex): express.Handler => {
  return async (req, res, next) => {
    try {
      let jwt = (req as any).user || {}
      let api = (req as any).api as Api
      await route({ req, res, next, knex, api, jwt })
    } catch (error) {
      next(error)
    }
  }
}

const tidyError = (error: Error): Error => {
  if (!error.stack) return error
  let cwd = new RegExp(escapeStringRegexp(process.cwd() + '/'), 'g')
  error.stack = error.stack.replace(cwd, '')
  return error
}

export function applyMiddleware(app: express.Application, knex: Knex) {
  app.use(bodyParser.json())
  app.use(cookieParser(process.env.COOKIE_SECRET!))
  app.use(Api.middleware({}))
  app.use(jwtParser(jwtConfig))
}

export function applyRoutes(app: express.Application, knex: Knex) {
  const r = (route: Route) => makeRoute(route, knex)

  // Add our routes
  app.get('/', r(routes.pages.home))

  app.get('/api/users', r(routes.users.me))
  app.post('/api/users', r(routes.users.request))
  app.get('/api/check', r(routes.users.check))
}

export function applyHandler(app: express.Application, knex: Knex) {
  // Add error handler
  let handler: ErrorHandler = (err, req, res, next) => {
    let api = (req as any).api as Api

    // Process iterables / strings into an array of messages
    if (err[Symbol.iterator] || typeof err === 'string') {
      return api.sendFail(Array.from(err))
    }

    if (err instanceof HttpError) {
      res.status(err.status)
    }

    if (err instanceof Redirect) {
      return res.redirect(err.status, err.url)
    }

    // Log errors that were thrown
    if (err instanceof Error) {
      console.error('Caught error', tidyError(err) + '\n')
      if (process.env.NODE_ENV === 'development') {
        return api.sendFail(err.message)
      }
    }
    api.sendFail('Something went wrong')
  }

  app.use(handler)
}

export function makeServer(knex: Knex): express.Application {
  let app = express()
  app.set('trust proxy', 1)
  app.set('view engine', 'pug')

  applyMiddleware(app, knex)
  applyRoutes(app, knex)
  applyHandler(app, knex)

  return app
}

export function startServer(app: express.Application, port: number) {
  return new Promise((resolve, reject) => {
    app.listen(port, (err: any) => {
      if (err) reject(err)
      else resolve()
    })
  })
}
