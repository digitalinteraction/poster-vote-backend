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

  static withMochaHooks(): TestHarness {
    let harness = new TestHarness()
    before(() => harness.setup())
    after(() => harness.teardown())
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
    app.set('views', join(__dirname, '../../views'))
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

async function insertRows(knex: Knex, table: string, records: any[]) {
  await knex(table).insert(records)
  let rows: any[] = await knex(table).select('id')
  return rows.map(o => o.id)
}

// async function getRowIds(table: string, knex: Knex) {
//   let rows: any[] = await knex(table).select('id')
//   return rows.map(o => o.id)
// }

export async function seedPosters(knex: Knex, userJwt: string) {
  const [poster_id] = await knex(Table.poster).insert({
    name: 'name',
    question: 'question',
    code: 123456,
    creator_hash: userJwt,
    colour: 'C0FFEE',
    owner: 'Geoff Testington',
    contact: 'geoff@test.io',
    active: true
  })

  // An inactive poster
  await knex(Table.poster).insert({
    name: 'name',
    question: 'question',
    code: 123456,
    creator_hash: userJwt,
    colour: 'C0FFEE',
    active: false
  })

  // A poster for a different user
  await knex(Table.poster).insert({
    name: 'name',
    question: 'question',
    code: 123456,
    creator_hash: 'an_non_active_user',
    colour: 'C0FFEE',
    active: false
  })

  // Add some options to our poster
  const [optionA, optionB, optionC] = await insertRows(
    knex,
    Table.posterOption,
    [
      { text: 'Option A', value: 1, poster_id },
      { text: 'Option B', value: 2, poster_id },
      { text: 'Option C', value: 3, poster_id }
    ]
  )

  // Create some devices
  const deviceIds = await insertRows(knex, Table.device, [
    { uuid: 1 },
    { uuid: 2 }
  ])

  const [devicePosterA, devicePosterB] = await insertRows(
    knex,
    Table.devicePoster,
    [
      { poster_id, device_id: deviceIds[0] },
      { poster_id, device_id: deviceIds[1] }
    ]
  )

  const makeCount = (v: number, devicePosterId: number, optionId: number) => ({
    value: v,
    poster_option_id: optionId,
    device_poster_id: devicePosterId
  })

  // Create the initial counts
  await knex(Table.deviceCount).insert([
    makeCount(0, devicePosterA, optionA),
    makeCount(0, devicePosterA, optionB),
    makeCount(0, devicePosterA, optionC),
    makeCount(10, devicePosterB, optionA),
    makeCount(15, devicePosterB, optionB),
    makeCount(20, devicePosterB, optionC)
  ])

  // Create the final counts
  await knex(Table.deviceCount).insert([
    makeCount(5, devicePosterA, optionA),
    makeCount(10, devicePosterA, optionB),
    makeCount(15, devicePosterA, optionC),
    makeCount(30, devicePosterB, optionA),
    makeCount(25, devicePosterB, optionB),
    makeCount(20, devicePosterB, optionC)
  ])

  // Total votes:
  // A - 25
  // B - 20
  // C - 15

  return poster_id
}
