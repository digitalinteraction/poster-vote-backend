import * as Knex from 'knex'

import { Poster, PosterOption, Device, DeviceCount } from 'src/types'

export type Queries = {
  with: (knex: Knex) => Queries
  posterWithOptions: (id: number) => Promise<Poster | null>
}

export const makeQueries = (knex: Knex): Queries => ({
  with(knex: Knex) {
    return makeQueries(knex)
  },

  async posterWithOptions(id) {
    let poster = await knex('posters')
      .where({ id, active: true })
      .first()

    if (!poster) return null

    poster.options = await knex('poster_options').where('poster_id', poster.id)

    return poster
  }
})
