'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
async function up(knex) {
  await knex.schema.createTable('posters', table => {
    table.increments()
    table.timestamps(true, true)
    table.string('question', 255)
    table.integer('code').unsigned()
    table.string('colour', 32)
    table.string('owner', 255)
    table.string('contact', 255)
  })
}
exports.up = up
async function down(knex) {
  await knex.schema.dropTable('posters')
}
exports.down = down
