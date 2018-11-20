import * as Knex from 'knex'

export async function up(knex: Knex) {
  await knex.schema.createTable('devices', table => {
    table.increments()
    table.timestamps(true, true)
    table.integer('uuid').unsigned()
  })

  await knex.schema.createTable('device_poster', table => {
    table.increments()
    table.timestamps(true, true)
    table.integer('poster_id').unsigned()
    table.integer('device_id').unsigned()

    table.foreign('poster_id').references('posters.id')
    table.foreign('device_id').references('devices.id')
  })
}

export async function down(knex: Knex) {
  await knex.schema.dropTable('device_poster')
  await knex.schema.dropTable('devices')
}
