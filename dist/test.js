'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const Knex = require('knex')
const db_1 = require('./core/db')
;(async () => {
  try {
    let knex = Knex({
      // client: 'sqlite3',
      // connection: { filename: ':memory:' }
      client: 'mysql',
      connection: 'mysql://root:secret@127.0.0.1/postervote'
      // migrations: {
      //   directory: join(__dirname, 'migrations'),
      //   tableName: '_migrations'
      // }
    })
    // console.log('A')
    // await knex.migrate.latest()
    // console.log('B')
    let mm = new db_1.MigrationManager(knex)
    await mm.sync()
  } catch (error) {
    console.log(error)
  }
})()
