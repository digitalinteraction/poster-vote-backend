import * as program from 'commander'
import * as Knex from 'knex'
import { dbFromEnvironment, MigrationManager } from 'src/core/db'
import { makeUserJwt } from 'src/core/jwt'
import { hashEmail } from 'src/core/emails'
import chalk from 'chalk'

let knex = dbFromEnvironment()

let commandRan = false
let migrator = new MigrationManager(knex)

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
