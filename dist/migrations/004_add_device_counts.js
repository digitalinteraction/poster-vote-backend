'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
async function up(knex) {
  await knex.schema.createTable('device_counts', table => {
    table.increments()
    table.timestamps(true, true)
    table.integer('value').unsigned()
    table.integer('poster_option_id').unsigned()
    table.foreign('poster_option_id').references('poster_options.id')
  })
}
exports.up = up
async function down(knex) {
  await knex.schema.dropTable('device_counts')
}
exports.down = down
