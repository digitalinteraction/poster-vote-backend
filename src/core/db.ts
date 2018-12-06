import Knex from 'knex'
import { join } from 'path'
import * as fs from 'fs'
import { promisify } from 'util'
import { Record } from '../types'
import { check, cross } from '../const'
import validateEnv = require('valid-env')

const readdir = promisify(fs.readdir)
const migrationTable = '_migrations'

const migrationExt = '.' + (process.env.EXECUTOR || 'js')

type Migration = Record & {
  name: string
}

type Migrator = {
  name: string
  up(knex: Knex): Promise<void>
  down(knex: Knex): Promise<void>
}

export function dbFromEnvironment(): Knex {
  validateEnv(['DB_TYPE', 'DB_URI'])
  return Knex({
    client: process.env.DB_TYPE,
    connection: process.env.DB_URI
  })
}

export class MigrationManager {
  constructor(public knex: Knex) {}

  async setup(): Promise<void> {
    let hasTable = await this.knex.schema.hasTable(migrationTable)
    if (hasTable) return

    return this.knex.schema.createTable(migrationTable, table => {
      table.increments()
      table.timestamps(true, true)
      table.string('name')
    })
  }

  // async teardown(): Promise<void> {
  //   return this.knex.schema.dropTable(migrationTable)
  // }

  async currentVersion(): Promise<string | undefined> {
    let latest: Migration = await this.knex(migrationTable)
      .select('*')
      .orderBy('id', 'desc')
      .first()

    return latest ? latest.name : undefined
  }

  async getMigrators(): Promise<Migrator[]> {
    let basePath = join(__dirname, '../migrations')
    let paths = await readdir(basePath)

    paths = paths.filter(p => p.endsWith(migrationExt))

    return Promise.all(
      paths.map(async file => {
        let m = await import(join(basePath, file))
        let name = file.replace(migrationExt, '')
        return Object.assign({ name }, m)
      })
    )
  }

  async sync(): Promise<void> {
    try {
      await this.setup()

      // Get our migrators and the current migration level
      let migrators = await this.getMigrators()
      let currentVersion = await this.currentVersion()

      // If we have a version, filter out executed migrators
      if (currentVersion !== undefined) {
        let pivot = migrators.findIndex(m => m.name === currentVersion)
        migrators = pivot === -1 ? migrators : migrators.slice(pivot + 1)
      }

      console.log(`${migrators.length} migrations to perform`)

      // Run each migration
      for (let migrator of migrators) {
        await this.knex.transaction(trx => this.doMigration(trx, migrator))
        console.log(check, migrator.name)
      }
    } catch (error) {
      console.log(error)
      console.log(cross, error.message)
    }
  }

  async reset(): Promise<void> {
    try {
      await this.setup()

      // Get the migration records to undo
      let records: Migration[] = await this.knex(migrationTable)
        .column('name')
        .orderBy('id', 'desc')

      // Get our migrators and the current migration level
      let currentVersion = await this.currentVersion()
      let migrators = new Map<string, Migrator>()
      ;(await this.getMigrators()).forEach(migrator =>
        migrators.set(migrator.name, migrator)
      )

      // If there is a current version, filter out non-performed migrations
      if (currentVersion !== undefined) {
        let pivot = records.findIndex(r => r.name === currentVersion)
        records = pivot === -1 ? records : records.slice(pivot)
      }

      // Ensure each db migration has a migrator
      for (let migration of records) {
        if (migrators.has(migration.name)) continue
        console.error(cross, 'Invalid migrator:', migration.name)
      }

      console.log(`${records.length} migrations to reset`)

      // Run through each migration, undoing them in a transaction
      for (let migration of records) {
        let migrator = migrators.get(migration.name)!
        await this.knex.transaction(trx => this.undoMigration(trx, migrator))
        console.log(check, migrator.name)
      }
    } catch (error) {
      console.log(cross, error.message)
    }
  }

  async regenerate(): Promise<void> {
    await this.reset()
    await this.sync()
  }

  /** Perform a migration and write to the migrations table */
  private async doMigration(knex: Knex, migrator: Migrator) {
    await migrator.up(knex)
    await knex(migrationTable).insert({ name: migrator.name })
  }

  /** Reset a migration and delete from the migrations table */
  private async undoMigration(knex: Knex, migrator: Migrator) {
    await migrator.down(knex)
    await knex(migrationTable)
      .where({ name: migrator.name })
      .delete()
  }
}
