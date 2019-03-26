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
