import * as express from 'express'
import * as routes from '../routes'
import * as Knex from 'knex'
import { Api } from 'api-formatter'

import { RouteContext, Route, ExpressRoute } from 'src/types'

const makeRoute = (route: Route, knex: Knex): express.Handler => {
  return async (req, res, next) => {
    try {
      let api = (req as any).api as Api
      await route({ req, res, next, knex, api })
    } catch (error) {
      next(error)
    }
  }
}

export function applyMiddleware(app: express.Application, knex: Knex) {
  app.use(Api.middleware({}))
}

export function applyRoutes(app: express.Application, knex: Knex) {
  const r = (route: Route) => makeRoute(route, knex)

  // Add our routes
  app.get('/', r(routes.general.hello))
}

export function applyHandler(app: express.Application, knex: Knex) {
  // Add error handler
}

export function makeServer(knex: Knex): express.Application {
  let app = express()

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
