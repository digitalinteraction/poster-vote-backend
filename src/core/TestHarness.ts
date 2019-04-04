/*
 * A utility class for unit tests to perform common logic
 */

import { setupEnvironment } from '../env'
import { MigrationManager } from './db'
import Knex from 'knex'
import { Table } from '../const'
import { RouteContext } from '../types'
import supertest from 'supertest'
import { setupServer } from '../server'
import { jwtSign, jwtVerify, makeUserJwt } from './jwt'
import { ChowChow } from '@robb_j/chowchow'

export type TestAgent = supertest.SuperTest<supertest.Test>

export class MockChowChow extends ChowChow<RouteContext> {
  agent = supertest(this.expressApp)

  // Override these and to not actually start express
  protected async startServer() {}
  protected async stopServer() {}
}

export class TestHarness {
  chow: MockChowChow
  knex: Knex
  mm: MigrationManager

  /** Create a harness and hook in the #setup & #teardown with mocha */
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

    // Setup the environment for testing
    setupEnvironment('testing')

    // Connect to an in-memory sqline database
    this.knex = Knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true
    })

    // Create a migration manager
    this.mm = new MigrationManager(this.knex)

    // Create and setup the ChowChow instance
    this.chow = new MockChowChow()
    setupServer(this.chow, this.knex)
  }

  /** Setup (to be called before each test) */
  async setup() {
    await this.mm.sync()
    await this.chow.start()
  }

  /** Setup (to be called before each test) */
  async teardown() {
    await this.chow.stop()
  }

  /** Clear all tables */
  async clear() {
    return this.knex.transaction(trx => {
      return Promise.all(Object.values(Table).map(table => trx(table).delete()))
    })
  }

  /** Sign a jwt payload */
  signJwt(payload: any): string {
    return jwtSign(payload)
  }

  /** Verify a jwt payload */
  verifyJwt(token: string): string | object {
    return jwtVerify(token)
  }

  /** Create a user's jwt from their email */
  userJwt(email: string): string {
    return makeUserJwt(email)
  }
}

/** Inster data into the database */
async function insertRows(knex: Knex, table: string, records: any[]) {
  await knex(table).insert(records)
  let rows: any[] = await knex(table).select('id')
  return rows.map(o => o.id)
}

/** Seed the in-memory database with posters, options, devices and votes */
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
