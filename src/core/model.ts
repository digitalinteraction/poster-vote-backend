import * as Knex from 'knex'

type Query<R> = { [K in keyof R]?: any }
type Update<R> = { [K in keyof R]?: R[K] }

class Model<Record> {
  constructor(private knex: Knex, private table: string) {}

  query() {
    return this.knex(this.table)
  }

  async find<R = Record>(q: Query<Record>): Promise<R[]> {
    return this.query().where(q)
  }

  async findOne<R = Record>(q: Query<Record>): Promise<R | null> {
    return this.query()
      .where(q)
      .first()
  }

  async update<R = Record>(q: Query<Record>, u: Update<R>): Promise<number> {
    return this.query()
      .where(q)
      .update(u)
  }
}
