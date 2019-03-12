import { ChowChow, Module, BaseContext } from '@robb_j/chowchow'
import { Application } from 'express'
import Knex from 'knex'

import { Queries, makeQueries } from '../core/queries'

// How the module modifies the context
export type KnexContext = {
  knex: Knex
  queries: Queries
}

// The configuration for the module, useful as an exported type
export type KnexConfig = {}

export class KnexModule implements Module {
  app!: ChowChow
  knex!: Knex
  queries!: Queries

  constructor(knex: Knex) {
    this.knex = knex
  }

  checkEnvironment() {}

  setupModule() {
    // if (process.env.NODE_ENV === 'testing') {
    //   this.knex = Knex({
    //     client: 'sqlite3',
    //     connection: { filename: ':memory:' },
    //     useNullAsDefault: true
    //   })
    // } else {
    //   this.knex = Knex({
    //     client: process.env.DB_TYPE,
    //     connection: process.env.DB_URI
    //   })
    // }

    this.queries = makeQueries(this.knex)
  }

  async clearModule() {
    await this.knex.destroy()
  }

  extendExpress(app: Application) {}

  extendEndpointContext(ctx: BaseContext): KnexContext {
    return { knex: this.knex, queries: this.queries }
  }
}
