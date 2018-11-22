import * as Knex from 'knex'

import { Poster, PosterOption, Device, DeviceCount } from 'src/types'
import { Table } from 'src/const'

export type PosterWithOptions = Poster & { options: PosterOption[] }

export type PosterOptionVote = {
  id: string
  text: string
  value: number
  min: number
  max: number
  vote: number
}

export type Queries = {
  with: (knex: Knex) => Queries
  posterWithOptions: (id: number) => Promise<PosterWithOptions | null>
  posterVotes: (id: number) => Promise<PosterOptionVote[]>
  currentUser: (id: number) => Promise<any>
}

export const makeQueries = (knex: Knex): Queries => ({
  with(knex: Knex) {
    return makeQueries(knex)
  },

  async posterWithOptions(id) {
    let poster = await knex(Table.poster)
      .where({ id, active: true })
      .first()

    if (!poster) return null

    poster.options = await knex(Table.posterOption)
      .where('poster_id', poster.id)
      .orderBy('value', 'asc')

    return poster
  },

  async posterVotes(posterId: number) {
    let votes: PosterOptionVote[] = await knex(Table.posterOption)
      .select([
        'poster_options.id',
        'poster_options.text',
        'poster_options.value'
      ])
      .min({ min: 'device_counts.value' })
      .max({ max: 'device_counts.value' })
      .max({ recorded: 'device_counts.created_at' })
      .innerJoin(
        'device_counts',
        'device_counts.poster_option_id',
        'poster_options.id'
      )
      .where('poster_options.poster_id', posterId)
      .groupBy('poster_options.id')

    // Calculate the vote
    votes.forEach(v => {
      v.vote = v.max - v.min
    })

    return votes
  },

  async currentUser(id: number) {
    // let user = await knex(Table)
  }
})
