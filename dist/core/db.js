'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const path_1 = require('path')
const fs = require('fs')
const util_1 = require('util')
const chalk_1 = require('chalk')
const readdir = util_1.promisify(fs.readdir)
const migrationTable = '_migrations'
const check = chalk_1.default.green('✔')
const cross = chalk_1.default.red('✖')
class MigrationManager {
  constructor(knex) {
    this.knex = knex
  }
  async setup() {
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
  async currentVersion() {
    let latest = await this.knex(migrationTable)
      .select('*')
      .orderBy('id', 'desc')
      .first()
    return latest ? latest.name : undefined
  }
  async getMigrators() {
    let basePath = path_1.join(__dirname, '../migrations')
    let paths = await readdir(basePath)
    return Promise.all(
      paths.map(async file => {
        let m = await Promise.resolve().then(() =>
          require(path_1.join(basePath, file))
        )
        let name = file.replace('.ts', '')
        return Object.assign({ name }, m)
      })
    )
  }
  async sync() {
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
      console.log(cross, error.message)
    }
  }
  async reset() {
    try {
      await this.setup()
      // Get the migration records to undo
      let records = await this.knex(migrationTable)
        .column('name')
        .orderBy('id', 'desc')
      // Get our migrators and the current migration level
      let currentVersion = await this.currentVersion()
      let migrators = new Map()
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
        let migrator = migrators.get(migration.name)
        await this.knex.transaction(trx => this.undoMigration(trx, migrator))
        console.log(check, migrator.name)
      }
    } catch (error) {
      console.log(cross, error.message)
    }
  }
  /** Perform a migration and write to the migrations table */
  async doMigration(knex, migrator) {
    await migrator.up(knex)
    await knex(migrationTable).insert({ name: migrator.name })
  }
  /** Reset a migration and delete from the migrations table */
  async undoMigration(knex, migrator) {
    await migrator.down(knex)
    await knex(migrationTable)
      .where({ name: migrator.name })
      .delete()
  }
}
exports.MigrationManager = MigrationManager
