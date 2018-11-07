'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
async function up(knex) {
  await knex.schema.createTable('devices', table => {
    table.increments()
    table.timestamps(true, true)
    table.integer('registration_id').unsigned()
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
exports.up = up
async function down(knex) {
  await knex.schema.dropTable('device_poster')
  await knex.schema.dropTable('devices')
}
exports.down = down
