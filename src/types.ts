import { Request, Response, NextFunction } from 'express'
import * as Knex from 'knex'

// import * as s from 'sequelize'
// import { SqlFn } from 'src/sql'

export type RouteContext = {
  req: Request
  res: Response
  next: NextFunction
}

export type Migration = {
  up(knex: Knex): Promise<void>
  down(knex: Knex): Promise<void>
}

export type Record = {
  id: number
}

export type WithTimestamps = {
  created_at: Date
  updated_at: Date
}
