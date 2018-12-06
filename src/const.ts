import chalk from 'chalk'
import { join } from 'path'

export const cookieName = 'postervote_jwt'
export const check = chalk.green('✔')
export const cross = chalk.red('✖')

export const Table = {
  poster: 'posters',
  posterOption: 'poster_options',
  device: 'devices',
  devicePoster: 'device_poster',
  deviceCount: 'device_counts'
}

export const posterAssetDir = join(__dirname, '../static/poster/simple')
