import { Request, Response, NextFunction } from 'express'
import { Api } from 'api-formatter'
import * as Knex from 'knex'

export type RouteContext = {
  req: Request
  res: Response
  next: NextFunction
  knex: Knex
  api: Api
}

export type Route = (ctx: RouteContext) => Promise<void> | void
export type ExpressRoute = any

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
  owner: string
  contact: string
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
