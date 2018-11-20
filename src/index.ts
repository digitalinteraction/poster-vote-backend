import { makeServer, startServer } from 'src/core/server'
import { dbFromEnvironment } from 'src/core/db'
import { setupFskDirectories } from 'src/core/fsk'

import validateEnv = require('valid-env')
import * as anisi from 'ansi-escapes'
import { EventEmitter } from 'events'

// const clearIfDev = () =>
//   process.env.NODE_ENV === 'development' &&
//   process.stdout.write(anisi.clearScreen)
//
// clearIfDev()

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

export const validate = () =>
    validateEnv([
      'API_URL',
      'WEB_URL',
      'DB_TYPE',
      'DB_URI',
      'JWT_SECRET',
      'COOKIE_SECRET',
      'ADMIN_EMAIL',
      'SENDGRID_API_KEY',
      'HASH_SECRET'
    ])

  // Startup the app
;(async () => {
  try {
    validate()

    setupFskDirectories()

    let knex = dbFromEnvironment()
    let app = makeServer(knex)

    await startServer(app, 3000)

    console.log('Listening on :3000')
  } catch (error) {
    console.log(error)
  }
})()
