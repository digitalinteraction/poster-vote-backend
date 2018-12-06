import Knex from 'knex'

export async function up(knex: Knex) {
  await knex.schema.createTable('poster_options', table => {
    table.increments()
    table.timestamps(true, true)
    table.string('text', 255)
    table.integer('value').unsigned()
    table.integer('poster_id').unsigned()

    table.foreign('poster_id').references('posters.id')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('poster_options')
}
