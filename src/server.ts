import { join } from 'path'

import { ChowChow } from '@robb_j/chowchow'
import { JsonEnvelopeModule } from '@robb_j/chowchow-json-envelope'
import { LoggerModule } from '@robb_j/chowchow-logger'
import { AuthModule, SendgridStrategy } from '@robb_j/chowchow-auth'
import express from 'express'
import cors from 'cors'
import escapeStringRegexp from 'escape-string-regexp'
import Knex from 'knex'
import pug from 'pug'
import serveFavicon from 'serve-favicon'

import { RouteContext } from './types'
import { Redirect, HttpError } from './core/errors'
import * as routes from './routes'
import { KnexModule } from './modules/KnexModule'
import { cookieName } from './const'

export const tidyError = (error: Error): Error => {
  if (!error.stack) return error
  let cwd = new RegExp(escapeStringRegexp(process.cwd() + '/'), 'g')
  error.stack = error.stack.replace(cwd, '')
  return error
}

export const loginTemplate = pug.compileFile(
  join(__dirname, '../view/loginEmail.pug')
)

export function formatLoginEmail(email: string, link: string) {
  return loginTemplate({
    username: email.split('@')[0],
    loginUrl: link
  })
}

/**
 * Create a server with a specified database connection
 */
export function makeServer(knex: Knex) {
  let chow = ChowChow.create<RouteContext>()
  setupServer(chow, knex)
  return chow
}

/**
 * Decorate an existing server by registering modules, middleware and routes
 * This is a decorator so it can be used in unit tests to pass a custom ChowChow subclass
 */
export function setupServer(chow: ChowChow<RouteContext>, knex: Knex) {
  //
  // A json envelope module for structuring responses
  //
  const jsonEnvelopeModule = new JsonEnvelopeModule()

  //
  // The logger module
  //
  const loggerModule = new LoggerModule({
    path: process.env.LOG_PATH,
    enableAccessLogs: typeof process.env.LOG_PATH === 'string',
    enableErrorLogs: typeof process.env.LOG_PATH === 'string'
  })

  //
  // The authentication module for handling email-based authorisation
  //
  const authModule = new AuthModule(
    {
      loginRedir: process.env.WEB_URL!,
      publicUrl: process.env.API_URL!,
      cookieName
    },
    [
      new SendgridStrategy({
        fromEmail: process.env.ADMIN_EMAIL!,
        emailSubject: 'PosterVote login',
        emailBody: formatLoginEmail
      })
    ]
  )

  //
  // The database module to provide a db connection and queries
  //
  const knexModule = new KnexModule(knex)

  //
  // Setup ChowChow to use our modules
  //
  chow
    .use(jsonEnvelopeModule)
    .use(loggerModule)
    .use(authModule)
    .use(knexModule)

  //
  // Add express middleware
  //
  chow.applyMiddleware(app => {
    // Trust reverse proxies
    app.set('trust proxy', 1)

    // Parse json bodies
    app.use(express.json())

    // Add cors headers
    app.use(
      cors({
        origin: process.env.WEB_URL,
        credentials: true
      })
    )

    // Add a favicon
    app.use(serveFavicon(join(__dirname, '../static/favicon.png')))
  })

  //
  // Add express routes
  //
  chow.applyRoutes((app, r) => {
    // Auth routes
    app.get('/auth/me', r(routes.auth.me))
    app.post('/auth/logout', r(routes.auth.logout))

    // Posters routes
    app.get('/posters', r(routes.posters.index))
    app.get('/posters/:id', r(routes.posters.show))
    app.post('/posters', r(routes.posters.create))
    app.put('/posters/:id', r(routes.posters.update))
    app.delete('/posters/:id', r(routes.posters.destroy))
    app.get('/posters/:id/votes', r(routes.posters.votes))
    app.get('/posters/:id/print.pdf', r(routes.posters.print))

    // IVR routes
    app.get('/ivr/register/start', r(routes.ivr.registerStart))
    app.get('/ivr/register/poster', r(routes.ivr.registerWithDigits))
    app.get('/ivr/register/finish/:poster_id', r(routes.ivr.registerFinish))
    app.get('/ivr/vote/start', r(routes.ivr.voteStart))
    app.get('/ivr/vote/finish', r(routes.ivr.voteFinish))

    // Misc routes
    app.get('/', r(routes.general.hello))
    app.use('/static', express.static('static'))
  })

  //
  // Handle routing errors
  //
  chow.applyErrorHandler((err, { res, sendFail, logger }) => {
    //
    // If an interable was thrown (i.e. an Array or Set), send along those errors
    //
    if (err[Symbol.iterator] || typeof err === 'string') {
      return sendFail(Array.from(err))
    }

    //
    // If an http error was thrown, set the response's status code
    //
    if (err instanceof HttpError) {
      res.status(err.status)
    }

    //
    // If a http redirect error was thrown, perform the redirection
    //
    if (err instanceof Redirect) {
      return res.redirect(err.status, err.url)
    }

    //
    // For any other error, log it
    // If also in development mode, send back the error
    //
    if (err instanceof Error && !(err instanceof HttpError)) {
      logger.error(err.message, { stack: err.stack })
    }

    //
    // Generically handle errors if nothing else caught the error
    //
    sendFail(['Something went wrong'])
  })
}
