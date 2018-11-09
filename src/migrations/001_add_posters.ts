import * as Knex from 'knex'

export async function up(knex: Knex) {
  await knex.schema.createTable('posters', table => {
    table.increments()
    table.timestamps(true, true)
    table.string('name', 255)
    table.string('question', 255)
    table.integer('code').unsigned()
    table.string('creator_hash', 255)
    table.string('colour', 32)
    table.string('owner', 255)
    table.string('contact', 255)
    table.boolean('active').defaultTo(true)
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('posters')
}
