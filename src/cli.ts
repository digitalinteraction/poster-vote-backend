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
let warn = chalk.bold.red('DANGER') + ' '

program.version('0.1.0')

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
    console.log(chalk.green('token:'), chalk.cyan.underline(token))
  })

program.parse(process.argv)

if (!commandRan) {
  program.outputHelp()
}
