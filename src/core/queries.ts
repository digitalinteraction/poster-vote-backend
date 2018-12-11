/*
 *  A utility for named & reusable queries on the database
 */

import * as Knex from 'knex'

import { Poster, PosterOption } from '../types'
import { Table } from '../const'

export type PosterWithOptions = Poster & { options: PosterOption[] }

export type PosterVote = {
  option_id: number
  vote: number
}

export type PosterOptionVote = {
  id: number
  text: string
  value: number
  min: number
  max: number
  vote: number
}

export type Queries = {
  with: (knex: Knex) => Queries
  posterWithOptions: (id: number) => Promise<PosterWithOptions | null>
  posterVotes: (id: number) => Promise<PosterVote[]>
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
    let allVotes: PosterOptionVote[] = await knex(Table.posterOption)
      .select([
        'poster_options.id',
        'poster_options.text',
        'poster_options.value'
      ])
      .min({ min: 'device_counts.value' })
      .max({ max: 'device_counts.value' })
      .max({ recorded_at: 'device_counts.created_at' })
      .innerJoin(
        'device_counts',
        'device_counts.poster_option_id',
        'poster_options.id'
      )
      .where('poster_options.poster_id', posterId)
      .groupBy('poster_options.id', 'device_counts.device_poster_id')

    // Calculate the final vote for each option
    const keyedVotes: { [idx: number]: number } = {}

    // Count the votes for each option
    allVotes.forEach(v => {
      if (!keyedVotes[v.id]) keyedVotes[v.id] = 0
      keyedVotes[v.id] += v.max - v.min
    })

    // Convert to back to an array
    const output = []
    for (let optionId in keyedVotes) {
      output.push({
        option_id: parseInt(optionId, 10),
        vote: keyedVotes[optionId]
      })
    }

    return output
  }
})
