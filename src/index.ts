/*
 *  This is the entrypoint to the application
 *  1. It validates and sets up the environment
 *  2. It connects to the database
 *  3. Then starts the server on port 3000
 */

import { makeServer } from './server'
import { dbFromEnvironment } from './core/db'
import { setupFskDirectories } from './core/fsk'
import { setupEnvironment, checkEnvironment } from './env'

// Startup the app
;(async () => {
  try {
    setupEnvironment(process.env.NODE_ENV || 'production')

    checkEnvironment()

    setupFskDirectories()

    let knex = dbFromEnvironment()
    let app = makeServer(knex)

    // await startServer(app, 3000)
    await app.start()

    console.log('Listening on :3000')
  } catch (error) {
    console.log(error)
  }
})()
