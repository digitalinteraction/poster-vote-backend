import { makeServer, startServer } from './core/server'
import { dbFromEnvironment } from './core/db'
import { setupFskDirectories } from './core/fsk'

import validateEnv from 'valid-env'

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
      'HASH_SECRET',
      'REG_TWILIO_NUMBER',
      'VOTE_TWILIO_NUMBER'
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
