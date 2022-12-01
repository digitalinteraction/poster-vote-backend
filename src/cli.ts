/*
 *  This is the CLI entrypoint to the app, providing different commands
 */

import { Command } from 'commander'
import { bulkAppend, bulkInsert } from './bulk'
import { dbFromEnvironment, MigrationManager } from './core/db'
import { makeUserJwt } from './core/jwt'
import { checkEnvironment, setupEnvironment } from './env'
import { makeServer } from './server'

const program = new Command()

const knex = dbFromEnvironment()

const migrator = new MigrationManager(knex, true)

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
    setupEnvironment(process.env.NODE_ENV || 'production')

    checkEnvironment()

    const knex = dbFromEnvironment()
    const app = makeServer(knex)

    await app.start()

    console.log('Listening on :3000')
  })

program
  .command('db:migrate')
  .description('Perform database migrations (oldest to newest)')
  .action(async () => {
    await migrator.sync()
    await knex.destroy()
  })

program
  .command('db:destroy')
  .description('DANGER: Undo database migrations (newest to oldest)')
  .action(async () => {
    await migrator.reset()
    await knex.destroy()
  })

program
  .command('db:regenerate')
  .description('DANGER: Undo database migrations then perform them again')
  .action(async () => {
    await migrator.regenerate()
    await knex.destroy()
  })

program
  .command('jwt:token <email>')
  .description('Generate a JWT for a given email')
  .action(async (email: string) => {
    console.log('token:', makeUserJwt(email))
  })

program
  .command('bulk:append')
  .description('Start or append-to a bulk upload file')
  .argument('<input-file>', 'The existing bulk file or what to create')
  .argument('<device>', 'The existing bulk file or what to create')
  .action(async (inputFile: string, device: string) => {
    await bulkAppend(inputFile, device)
  })

program
  .command('bulk:insert')
  .description('Bulk register posters')
  .argument('<input-file>', 'The file to read in')
  .action(async (inputFile: string) => bulkInsert(inputFile))

program.parseAsync(process.argv).catch((error) => {
  console.error('A fatal error occured')
  console.error(error)
})
