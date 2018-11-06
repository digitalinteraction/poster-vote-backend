import { SchemaBuilder } from 'knex'

export function up(schema: SchemaBuilder) {
  return Promise.all([
    schema.createTable('devices', table => {
      table.increments()
      table.timestamps(true, true)
      table.integer('registration_id').unsigned()
    }),
    schema.createTable('device_poster', table => {
      table.integer('poster_id').unsigned()
      table.integer('device_id').unsigned()

      table.foreign('poster_id').references('posters.id')
      table.foreign('device_id').references('devices.id')
    })
  ])
}

export function down(schema: SchemaBuilder) {
  return Promise.all([
    schema.dropTable('device_poster'),
    schema.dropTable('devices')
  ])
}
