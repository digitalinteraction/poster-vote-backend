import { join } from 'path'

import * as express from 'express'
import * as routes from '../routes'
import * as Knex from 'knex'
import { Api } from 'api-formatter'
import * as bodyParser from 'body-parser'
import * as cors from 'cors'
import * as cookieParser from 'cookie-parser'
import * as jwtParser from 'express-jwt'
import * as escapeStringRegexp from 'escape-string-regexp'

import { RouteContext, Route } from 'src/types'
import { cookieName } from 'src/const'
import { Redirect, HttpError } from 'src/core/errors'
import { jwtParserConfig } from 'src/core/jwt'
import { makeQueries } from 'src/core/queries'
import { makeModels } from 'src/core/model'

type ErrorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void

const makeRoute = (route: Route, knex: Knex): express.Handler => {
  return async (req, res, next) => {
    try {
      let jwt = (req as any).user || undefined
      let api = (req as any).api as Api
      let queries = makeQueries(knex)
      // let models = makeModels(knex)
      await route({ req, res, next, knex, api, jwt, queries })
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
  app.use(jwtParser(jwtParserConfig))
  app.use(
    cors({
      origin: process.env.WEB_URL,
      credentials: true
    })
  )
}

export function applyRoutes(app: express.Application, knex: Knex) {
  const r = (route: Route) => makeRoute(route, knex)

  // Auth routes
  app.get('/users', r(routes.users.me))
  app.post('/users', r(routes.users.request))
  app.delete('/users', r(routes.users.logout))
  app.get('/check', r(routes.users.check))

  // Posters routes
  app.get('/posters', r(routes.posters.index))
  app.get('/posters/:id', r(routes.posters.show))
  app.post('/posters', r(routes.posters.create))
  app.delete('/posters/:id', r(routes.posters.destroy))
  app.get('/posters/:id/votes', r(routes.posters.votes))

  // IVR routes
  app.get('/ivr/register/start', r(routes.ivr.registerStart))
  app.get('/ivr/register/poster', r(routes.ivr.registerWithDigits))
  app.get('/ivr/register/finish/:poster_id', r(routes.ivr.registerFinish))
  app.get('/ivr/vote/start', r(routes.ivr.voteStart))
  app.get('/ivr/vote/finish', r(routes.ivr.voteFinish))

  // Misc routes
  app.get('/', r(routes.general.hello))
  app.use('/static', express.static('static'))
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

  // Setup rendering
  app.set('views', join(__dirname, '../views'))
  app.set('view engine', 'pug')
  app.locals = {}

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
