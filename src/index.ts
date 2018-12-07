/*
 *  This is the entrypoint to the application
 *  1. It validates and sets up the environment
 *  2. It connects to the database
 *  3. Then starts the server on port 3000
 */

import { makeServer, startServer } from './core/server'
import { dbFromEnvironment } from './core/db'
import { setupFskDirectories } from './core/fsk'

import validateEnv from 'valid-env'
import environments from './env'

// Validates that the required environment variables are set
export function validate() {
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
}

// Ensure NODE_ENV is set and apply a default environment if there is one
export function setupEnvironment() {
  if (process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = 'production'
  }

  // If a default environment config exists, apply that
  const defaultEnv = environments[process.env.NODE_ENV]
  if (!defaultEnv) return

  // Go through each variable but only set if it is already unset
  Object.entries(defaultEnv).forEach(([name, defaultValue]) => {
    if (process.env[name] !== undefined) return
    process.env[name] = defaultValue
  })
}

// Startup the app
;(async () => {
  try {
    setupEnvironment()

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
