import * as Knex from 'knex'
import { join } from 'path'
import * as fs from 'fs'
import { promisify } from 'util'
import { Migration, Record, WithTimestamps } from 'src/types'
import chalk from 'chalk'

const readdir = promisify(fs.readdir)
const migrationTable = '_migrations'

const cross = chalk.red('✖')

type MigrationRecord = Record &
  WithTimestamps & {
    name: string
  }

type Migrator = {
  name: string
  up(knex: Knex.SchemaBuilder): Promise<void>
  down(knex: Knex.SchemaBuilder): Promise<void>
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
    let latest: MigrationRecord = await this.knex(migrationTable)
      .select('*')
      .orderBy('id', 'desc')
      .first()

    return latest ? latest.name : undefined
  }

  async getMigrators(): Promise<Migrator[]> {
    let basePath = join(__dirname, '../migrations')
    let paths = await readdir(basePath)

    return Promise.all(
      paths.map(async file => {
        let m = await import(join(basePath, file))
        let name = file.replace('.ts', '')
        return Object.assign({ name }, m)
      })
    )
  }

  async sync(): Promise<void> {
    await this.setup()

    let migrators = await this.getMigrators()
    let currentVersion = await this.currentVersion()

    let pivot = migrators.findIndex(
      m => currentVersion !== undefined && m.name === currentVersion
    )

    let toRun = pivot === -1 ? migrators : migrators.slice(pivot + 1)

    for (let migrator of toRun) {
      console.log('running', migrator.name)
      try {
        console.log(migrator)
        await this.knex.transaction(trx => {
          return migrator
            .up(trx.schema)
            .then(() => trx(migrationTable).insert({ name: migrator.name }))
        })
      } catch (error) {
        console.error(cross, error.message)
        break
      }
    }
  }

  async reset(): Promise<void> {
    await this.setup()

    let records: MigrationRecord[] = await this.knex(migrationTable)
      .column('name')
      .orderBy('id', 'desc')

    let migrations = new Map<string, Migrator>()
    ;(await this.getMigrators()).forEach(migrator =>
      migrations.set(migrator.name, migrator)
    )

    for (let migration of records) {
      console.log('removing', migration.name)
      let migrator = migrations.get(migration.name)

      if (!migrator) {
        console.error(cross, 'Invalid migrator', migration.name)
        break
      }

      try {
        await migrator.down(this.knex.schema)
        await this.knex(migrationTable)
          .where({ name: migration.name })
          .delete()
      } catch (error) {
        console.error(cross, error.message)
        break
      }
    }
  }
}
