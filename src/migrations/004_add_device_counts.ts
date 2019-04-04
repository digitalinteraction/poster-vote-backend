import Knex from 'knex'

//
// A database migration to add the device_counts table
//

export async function up(knex: Knex) {
  await knex.schema.createTable('device_counts', table => {
    table.increments()
    table.timestamps(true, true)
    table.integer('value').unsigned()
    table.integer('poster_option_id').unsigned()
    table.integer('device_poster_id').unsigned()

    table.foreign('poster_option_id').references('poster_options.id')
    table.foreign('device_poster_id').references('device_poster.id')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('device_counts')
}
