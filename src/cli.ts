/*
 *  This is the CLI entrypoint to the app, providing different commands
 */

import { Command } from 'commander'
import { dbFromEnvironment, MigrationManager } from './core/db'
import { setupFskDirectories } from './core/fsk'
import { makeUserJwt } from './core/jwt'
import { checkEnvironment, setupEnvironment } from './env'
import { makeServer } from './server'

const program = new Command()

const knex = dbFromEnvironment()

let commandRan = false
const migrator = new MigrationManager(knex, true)
const warn = 'DANGER: '

program.version('0.1.0')

/**
 *  This is the entrypoint to the application, it:
 *  1. Validates and sets up the environment
 *  2. Connects to the database
 *  3. Starts the server on port 3000
 */
program
  .command('serve')
  .description('Run the server')
  .action(async () => {
    commandRan = true
    setupEnvironment(process.env.NODE_ENV || 'production')

    checkEnvironment()

    setupFskDirectories()

    const knex = dbFromEnvironment()
    const app = makeServer(knex)

    await app.start()

    console.log('Listening on :3000')
  })

program
  .command('db:migrate')
  .description('Perform database migrations (oldest to newest)')
  .action(async () => {
    commandRan = true
    await migrator.sync()
    await knex.destroy()
  })

program
  .command('db:destroy')
  .description(warn + 'Undo database migrations (newest to oldest)')
  .action(async () => {
    commandRan = true
    await migrator.reset()
    await knex.destroy()
  })

program
  .command('db:regenerate')
  .description(warn + 'Undo database migrations then perform them again')
  .action(async () => {
    commandRan = true
    await migrator.regenerate()
    await knex.destroy()
  })

program
  .command('jwt:token <email>')
  .description('Generate a JWT for a given email')
  .action(async (email: string) => {
    commandRan = true
    let token = makeUserJwt(email)
    console.log('token:', token)
  })

program.parse(process.argv)

if (!commandRan) {
  program.outputHelp()
}
