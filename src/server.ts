import { join } from 'path'

import { ChowChow, BaseContext } from '@robb_j/chowchow'
import { JsonEnvelopeModule } from '@robb_j/chowchow-json-envelope'
import { LoggerModule } from '@robb_j/chowchow-logger'
import { AuthModule, SendgridStrategy } from '@robb_j/chowchow-auth'
import express from 'express'
import cors from 'cors'
import escapeStringRegexp from 'escape-string-regexp'
import Knex from 'knex'

import { RouteContext } from './types'
import { Redirect, HttpError } from './core/errors'
import * as routes from './routes'
import { KnexModule } from './modules/KnexModule'

export const tidyError = (error: Error): Error => {
  if (!error.stack) return error
  let cwd = new RegExp(escapeStringRegexp(process.cwd() + '/'), 'g')
  error.stack = error.stack.replace(cwd, '')
  return error
}

export const makeUsername = (email: string) => email.split('@')[0]

export function makeServer(knex: Knex) {
  let chow = ChowChow.create<RouteContext>()
  setupServer(chow, knex)
  return chow
}

export function setupServer(chow: ChowChow<RouteContext>, knex: Knex) {
  const jsonEnvelopeModule = new JsonEnvelopeModule()

  const loggerModule = new LoggerModule({
    path: process.env.LOG_PATH,
    enableAccessLogs: typeof process.env.LOG_PATH === 'string',
    enableErrorLogs: typeof process.env.LOG_PATH === 'string'
  })

  const authModule = new AuthModule(
    {
      loginRedir: process.env.WEB_URL!,
      publicUrl: process.env.API_URL!
    },
    [
      new SendgridStrategy({
        fromEmail: process.env.ADMIN_EMAIL!,
        emailSubject: 'PosterVote login',
        emailBody: (email, link) =>
          `Hey ${makeUsername(email)},\nHere is your login link: ${link}\n\n`
      })
    ]
  )

  const knexModule = new KnexModule(knex)

  chow
    .use(jsonEnvelopeModule)
    .use(loggerModule)
    .use(authModule)
    .use(knexModule)

  //
  // Add express middleware
  //
  chow.applyMiddleware(app => {
    app.set('trust proxy', 1)

    app.set('views', join(__dirname, '../../views'))
    app.set('view engine', 'pug')
    app.locals = {}

    app.use(express.json())

    app.use(
      cors({
        origin: process.env.WEB_URL,
        credentials: true
      })
    )
  })

  //
  // Add express routes
  //
  chow.applyRoutes((app, r) => {
    // Auth routes
    app.get('/users', r(routes.users.me))
    app.delete('/users', r(routes.users.logout))
    // app.post('/users', r(routes.users.request))
    // app.get('/check', r(routes.users.check))

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
  chow.applyErrorHandler((err, { res, sendFail }) => {
    if (err[Symbol.iterator] || typeof err === 'string') {
      return sendFail(Array.from(err))
    }

    if (err instanceof HttpError) {
      res.status(err.status)
    }

    if (err instanceof Redirect) {
      return res.redirect(err.status, err.url)
    }

    if (err instanceof Error) {
      console.error('Caught error', tidyError(err) + '\n')
      if (process.env.NODE_ENV === 'development') {
        console.log(err.stack)
        return sendFail([err.message])
      }
    }

    sendFail(['Something went wrong'])
  })
}
