import * as Knex from 'knex'

export async function up(knex: Knex) {
  await knex.schema.createTable('device_counts', table => {
    table.increments()
    table.timestamps(true, true)
    table.integer('value').unsigned()
    table.integer('poster_option_id').unsigned()

    table.foreign('poster_option_id').references('poster_options.id')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('device_counts')
}
