'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
async function up(knex) {
  await knex.schema.createTable('poster_options', table => {
    table.increments()
    table.timestamps(true, true)
    table.string('text', 255)
    table.integer('poster_id').unsigned()
    table.foreign('poster_id').references('posters.id')
  })
}
exports.up = up
async function down(knex) {
  await knex.schema.dropTable('poster_options')
}
exports.down = down
