import { SchemaBuilder } from 'knex'

export async function up(schema: SchemaBuilder) {
  await schema.createTable('posters', table => {
    table.increments()
    table.timestamps(true, true)
    table.string('question', 255)
    table.string('colour', 32)
  })
}

export async function down(schema: SchemaBuilder) {
  await schema.dropTable('posters')
}
