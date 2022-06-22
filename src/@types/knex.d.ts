import { Knex } from 'knex'

declare module 'knex/types/tables' {
  interface Base {
    id: number
    created_at: Date
    updated_at: Date
  }

  interface Poster extends Base {
    name: string
    question: string
    code: number
    creator_hash: string
    colour: string
    owner: string
    contact: string
    active: boolean
  }

  interface PosterOption extends Base {
    text: string
    value: number
    poster_id: number
  }

  interface Device extends Base {
    uuid: number
  }

  interface DevicePoster extends Base {
    poster_id: number
    device_id: number
  }

  interface DeviceCount extends Base {
    value: number
    poster_option_id: number
    device_poster_id: number
  }

  interface Tables {
    posters: Poster
    poster_options: PosterOption
    devices: Device
    device_poster: DevicePoster
    device_counts: DeviceCount
  }
}
