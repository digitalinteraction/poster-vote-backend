import * as Knex from 'knex'

import { Poster, PosterOption, Device, DeviceCount } from 'src/types'

export type Query<R> = { [K in keyof R]?: any }
export type Update<R> = { [K in keyof R]?: R[K] }
export type Insert<R> = { [K in keyof R]?: R[K] }

export class Model<Record> {
  constructor(private knex: Knex, private table: string) {}

  query() {
    return this.knex(this.table)
  }

  with(knex: Knex) {
    return new Model<Record>(knex, this.table)
  }

  async find<R extends Record = Record>(q: Query<Record>): Promise<R[]> {
    return this.query().where(q)
  }

  async findOne<R extends Record = Record>(
    q: Query<Record>
  ): Promise<R | null> {
    return this.query()
      .where(q)
      .first()
  }

  async update<R extends Record = Record>(
    q: Query<Record>,
    u: Update<R>
  ): Promise<number> {
    return this.query()
      .where(q)
      .update(u)
  }

  async insert<R extends Record = Record>(
    u: Insert<R> | Insert<R>[]
  ): Promise<number[]> {
    return this.query().insert(u)
  }
}

export type ModelSet = {
  poster: Model<Poster>
  posterOption: Model<PosterOption>
  device: Model<Device>
  deviceCount: Model<DeviceCount>
}

export function makeModels(knex: Knex): ModelSet {
  return {
    poster: new Model<Poster>(knex, 'posters'),
    posterOption: new Model<PosterOption>(knex, 'poster_options'),
    device: new Model<Device>(knex, 'devices'),
    deviceCount: new Model<DeviceCount>(knex, 'device_counts')
  }
}
