import { SchemaBuilder } from 'knex'

export async function up(schema: SchemaBuilder) {
  await schema.createTable('poster_options', table => {
    table.increments()
    table.timestamps(true, true)
    table.string('text', 255)
  })
}

export async function down(schema: SchemaBuilder) {
  await schema.dropTable('poster_options')
}
