/*
 *  This is the CLI entrypoint to the app, providing different commands
 */

import program from 'commander'
import { dbFromEnvironment, MigrationManager } from './core/db'
import { makeUserJwt } from './core/jwt'
import chalk from 'chalk'

let knex = dbFromEnvironment()

let commandRan = false
let migrator = new MigrationManager(knex, true)

program.version('0.1.0')

program.command('db:migrate').action(async () => {
  commandRan = true
  await migrator.sync()
  await knex.destroy()
})

program.command('db:destroy').action(async () => {
  commandRan = true
  await migrator.reset()
  await knex.destroy()
})

program.command('db:regenerate').action(async () => {
  commandRan = true
  await migrator.regenerate()
  await knex.destroy()
})

program.command('jwt:token <email>').action(async (email: string) => {
  commandRan = true
  let token = makeUserJwt(email)
  console.log(chalk.green('token:'), chalk.cyan.underline(token))
})

program.parse(process.argv)

if (!commandRan) {
  program.outputHelp()
}
