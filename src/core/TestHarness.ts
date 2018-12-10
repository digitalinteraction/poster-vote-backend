import { setupEnvironment } from '../env'
import { MigrationManager } from './db'
import Knex from 'knex'
import { Table } from '../const'

export class TestHarness {
  knex: Knex
  mm: MigrationManager

  trx?: Knex

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
}
