import * as Knex from 'knex'
import { join } from 'path'
import { MigrationManager } from './core/db'

// const inputPackage = 'ide-typescript'
// const packageDeps = {}
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

    let mm = new MigrationManager(knex)

    await mm.sync()
  } catch (error) {
    console.log(error)
  }
})()
