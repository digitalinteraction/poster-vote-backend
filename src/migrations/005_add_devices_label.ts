import createKnex, { Knex } from 'knex'

//
// A database migration to add the device_counts table
//

export async function up(knex: Knex) {
  await knex.schema.alterTable('devices', (table) => {
    table.string('label', 255)
  })
}

export async function down(knex: Knex) {
  await knex.schema.alterTable('devices', (table) => {
    table.dropColumn('label')
  })
}
