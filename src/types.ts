/*
 *  This file contains definitions that are re-used throughout the project
 */

import { BaseContext } from '@robb_j/chowchow'
import { LoggerContext } from '@robb_j/chowchow-logger'
import { AuthContext } from '@robb_j/chowchow-auth'
import { JsonEnvelopeContext } from '@robb_j/chowchow-json-envelope'
import { KnexContext } from './modules/KnexModule'

export type RouteContext = BaseContext &
  KnexContext &
  LoggerContext &
  AuthContext &
  JsonEnvelopeContext

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
