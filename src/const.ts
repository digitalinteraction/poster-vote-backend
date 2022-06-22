/*
 *  This file contains constants that are re-used throughout the project
 */

// import chalk from 'chalk'
import { join } from 'path'

export const cookieName = 'postervote_jwt'
export const check = '✔'
export const cross = '✖'

export const Table = {
  poster: 'posters',
  posterOption: 'poster_options',
  device: 'devices',
  devicePoster: 'device_poster',
  deviceCount: 'device_counts',
  migration: '_migrations',
}

export const posterAssetDir = join(__dirname, '../static/poster/simple')
