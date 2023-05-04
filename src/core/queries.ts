/*
 *  A utility for named & reusable queries on the database
 */

import { Knex } from 'knex'

import { Device, Poster, PosterOption } from '../types'
import { Table } from '../const'

export type PosterWithOptions = Poster & { options: PosterOption[] }

export type PosterOptionVote = {
  id: number
  text: string
  value: number
  min: number
  max: number
  vote: number
  recorded_at: Date
  device_id: number
}

export interface AggregateVote {
  option_id: number
  vote: number
}

export type Queries = {
  with: (knex: Knex) => Queries
  posterWithOptions: (id: number) => Promise<PosterWithOptions | null>
  devicePosterVotes: (id: number) => Promise<PosterOptionVote[]>
  sumPosterVotes: (votes: PosterOptionVote[]) => AggregateVote[]
  assignDevice: (
    uuid: number,
    posterId: number
  ) => Promise<{ deviceId: number; devicePosterId: number }>
  storeDeviceVotes: (
    poster: PosterWithOptions,
    votes: number[],
    devicePosterId: number
  ) => Promise<void>
}

export const makeQueries = (knex: Knex): Queries => ({
  with(knex: Knex) {
    return makeQueries(knex)
  },

  async posterWithOptions(id) {
    let poster = await knex(Table.poster).where({ id, active: true }).first()

    if (!poster) return null

    poster.options = await knex(Table.posterOption)
      .where('poster_id', poster.id)
      .orderBy('value', 'asc')

    return poster
  },

  async devicePosterVotes(posterId: number) {
    return knex(Table.posterOption)
      .select({
        id: 'poster_options.id',
        text: 'poster_options.text',
        value: 'poster_options.value',
        device_id: 'device_poster.device_id',
      })
      .min({ min: 'device_counts.value' })
      .max({ max: 'device_counts.value' })
      .max({ recorded_at: 'device_counts.created_at' })
      .innerJoin(
        'device_counts',
        'device_counts.poster_option_id',
        'poster_options.id'
      )
      .innerJoin(
        'device_poster',
        'device_counts.device_poster_id',
        'device_poster.id'
      )
      .where('poster_options.poster_id', posterId)
      .groupBy('poster_options.id', 'device_counts.device_poster_id')
  },

  sumPosterVotes(allVotes: PosterOptionVote[]) {
    // Calculate the final vote for each option
    const keyedVotes: { [idx: number]: number } = {}

    // Count the votes for each option
    allVotes.forEach((v) => {
      if (!keyedVotes[v.id]) keyedVotes[v.id] = 0
      keyedVotes[v.id] += v.max - v.min
    })

    // Convert to back to an array
    const output = []
    for (let optionId in keyedVotes) {
      output.push({
        option_id: parseInt(optionId, 10),
        vote: keyedVotes[optionId],
      })
    }

    return output
  },

  async assignDevice(uuid: number, posterId: number) {
    // See if the device already exists
    let device: Device = await knex(Table.device).where({ uuid }).first()

    // Create the device if not found
    if (!device) {
      const [id] = await knex(Table.device).insert({ uuid })
      device = await knex(Table.device).select('*').where({ id }).first()
    }

    // Create the relation to the poster
    const [devicePosterId] = await knex(Table.devicePoster).insert({
      poster_id: posterId,
      device_id: device.id,
    })

    return { deviceId: device.id, devicePosterId }
  },

  async storeDeviceVotes(
    poster: PosterWithOptions,
    votes: number[],
    devicePosterId: number
  ) {
    // Reverse the order for the actual votes
    const optionIds = poster.options.map((o) => o.id).reverse()

    const records = votes
      .filter((_count, index) => optionIds[index])
      .map((count, index) => ({
        value: count,
        poster_option_id: optionIds[index],
        device_poster_id: devicePosterId,
      }))

    await knex(Table.deviceCount).insert(records)
  },
})
