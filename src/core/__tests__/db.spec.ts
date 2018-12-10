import Knex from 'knex'
import { MigrationManager } from '../db'
import { expect } from 'chai'
import { Table } from '../../const'

let knex: Knex
let mm: MigrationManager

beforeEach(async () => {
  knex = Knex({
    client: 'sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true
  })
  mm = new MigrationManager(knex)
})

afterEach(async () => {
  await knex.destroy()
})

describe('MigrationManager', () => {
  describe('#setup', () => {
    it('should create the migrations table', async () => {
      await mm.setup()
      const hasTable = await knex.schema.hasTable(Table.migration)
      expect(hasTable).to.equal(true)
    })
  })

  describe('#teardown', () => {
    it('should remove the migrations table', async () => {
      await mm.setup()
      await mm.teardown()

      const hasTable = await knex.schema.hasTable(Table.migration)
      expect(hasTable).to.equal(false)
    })
  })

  describe('#sync', () => {
    it('should run all migrations', async () => {
      await mm.sync()
      let migrations = await knex(Table.migration)
      expect(migrations.length).to.be.greaterThan(0)
    })
  })

  describe('#reset', () => {
    it('should undo all migrations', async () => {
      await mm.sync()
      await mm.reset()
      let migrations = await knex(Table.migration)
      expect(migrations.length).to.equal(0)
    })
  })
})
