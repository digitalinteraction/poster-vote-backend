import { Request, Response, NextFunction } from 'express'
import { Api } from 'api-formatter'
import { Queries } from 'src/core/queries'
import { ModelSet } from 'src/core/model'
import * as Knex from 'knex'

export type RouteContext = {
  req: Request
  res: Response
  next: NextFunction
  knex: Knex
  api: Api
  jwt?: UserJwt
  queries: Queries
  // models: ModelSet
}

export type Route = (ctx: RouteContext) => Promise<any> | any

export type UserJwt = { usr: string }

export type Record = WithIdentifier & WithTimestamps

export type WithIdentifier = {
  id: number
}

export type WithTimestamps = {
  created_at: Date
  updated_at: Date
}

export type Poster = Record & {
  question: string
  code: number
  colour: string
  owner: string | null
  contact: string | null
  creator_hash: string
}

export type PosterOption = Record & {
  text: string
  poster_id: number
}

export type Device = Record & {
  registration_id: number
}

export type DevicePoster = Record & {
  poster_id: number
  device_id: number
}

export type DeviceCount = Record & {
  value: number
  poster_option_id: number
}