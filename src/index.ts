import { makeServer, startServer } from './core/server'
import { dbFromEnvironment } from './core/db'

import validateEnv = require('valid-env')

export const validate = () => validateEnv(['DB_TYPE', 'DB_URI'])
;(async () => {
  try {
    validate()

    let knex = dbFromEnvironment()
    let app = makeServer(knex)

    await startServer(app, 3000)

    console.log('Listening on :3000')
  } catch (error) {
    console.log(error)
  }
})()
