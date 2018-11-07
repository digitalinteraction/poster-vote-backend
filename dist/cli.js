'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const program = require('commander')
const Knex = require('knex')
const db_1 = require('./core/db')
let knex = Knex({
  client: 'mysql',
  connection: 'mysql://root:secret@127.0.0.1/postervote'
})
let commandRan = false
let migrator = new db_1.MigrationManager(knex)
program.version('0.1.0')
program.command('db:migrate').action(async () => {
  commandRan = true
  await migrator.sync()
  await knex.destroy()
})
program.command('db:destroy').action(async () => {
  commandRan = true
  await migrator.reset()
  await knex.destroy()
})
program.parse(process.argv)
if (!commandRan) {
  program.outputHelp()
}
