import { join } from 'path'
import { setupEnvironment } from '../env'
import { MigrationManager } from './db'
import Knex from 'knex'
import { Table } from '../const'
import { Route } from '../types'
import express from 'express'
import supertest from 'supertest'
import { applyMiddleware, applyHandler } from './server'
import { jwtSign, jwtVerify, makeUserJwt } from './jwt'
import { makeQueries } from './queries'
import { Api } from 'api-formatter'

export { testEmails } from './emails'

export type TestRoute = supertest.SuperTest<supertest.Test>

export class TestHarness {
  knex: Knex
  mm: MigrationManager

  static async create(): Promise<TestHarness> {
    let harness = new TestHarness()
    await harness.setup()
    return harness
  }

  constructor() {
    if (process.env.NODE_ENV !== 'testing') {
      throw new Error('Not in testing environment')
    }

    setupEnvironment('testing')

    this.knex = Knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true
    })

    this.mm = new MigrationManager(this.knex)
  }

  async setup() {
    await this.mm.sync()
  }

  async teardown() {
    // Teardown code ...
    await this.knex.destroy()
  }

  async clear() {
    return this.knex.transaction(trx => {
      return Promise.all(Object.values(Table).map(table => trx(table).delete()))
    })
  }

  mockRoute(path: string, route: Route, jwt: any = undefined) {
    let app = express()
    applyMiddleware(app)

    // Setup rendering
    app.set('views', join(__dirname, '../views'))
    app.set('view engine', 'pug')

    let expressRoute: express.Handler = async (req, res, next) => {
      try {
        let knex = this.knex
        let queries = await makeQueries(knex)
        let api = (req as any).api as Api
        await route({ req, res, next, knex, jwt, queries, api })
      } catch (error) {
        next(error)
      }
    }

    app.use(path, expressRoute)

    applyHandler(app)

    return supertest(app)
  }

  signJwt(payload: any): string {
    return jwtSign(payload)
  }

  verifyJwt(token: string): string | object {
    return jwtVerify(token)
  }

  userJwt(email: string): string {
    return makeUserJwt(email)
  }
}
