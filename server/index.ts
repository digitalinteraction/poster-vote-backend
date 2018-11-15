import { makeServer, startServer } from 'server/core/server'
import { dbFromEnvironment } from 'server/core/db'
import { setupFskDirectories } from 'server/core/fsk'
import { startBundler } from './dev'

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
      'DB_TYPE',
      'DB_URI',
      'JWT_SECRET',
      'COOKIE_SECRET',
      'ADMIN_EMAIL',
      'SENDGRID_API_KEY',
      'HASH_SECRET',
      'PUBLIC_URL'
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

    if (process.env.NODE_ENV === 'development') {
      console.log('[dev] Starting bundler')
      await startBundler()
    }
  } catch (error) {
    console.log(error)
  }
})()
