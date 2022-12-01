// import { createWriteStream, WriteStream } from 'fs'
import { appendFile } from 'fs/promises'

import { SerialPort } from 'serialport'
import ndjson from 'ndjson'
import { createReadStream } from 'fs'
import { dbFromEnvironment } from './core/db'
import { checkEnvironment, setupEnvironment } from './env'
import { makeQueries } from './core/queries'

interface CurrentDevice {
  device?: number
  epoch?: number
  votes?: number[]
}

//
// A command to listen on serial for PosterVote debug info and append to an ndjson file
//
export async function bulkAppend(inputFile: string, device: string) {
  // Create a connection through USB
  const port = new SerialPort({ path: device, baudRate: 2400 }, (err) => {
    if (err) {
      console.error('SerialPort error')
      console.error(err)
      process.exit(1)
    }

    console.debug('open', inputFile)
  })

  const reset = () => {
    console.warn('Bad input, resetting')
    currentDevice = {}
  }

  // Read the data
  let currentDevice: CurrentDevice = {}
  let buffer = ''
  port.on('data', (data: Buffer) => {
    buffer += data.toString()

    let idx: number
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.substring(0, idx)
      buffer = buffer.substring(idx + 1)

      // Check for terms
      console.debug('found line %o', line)
      const match = /(\w+)\s*:\s*,?(.*)/.exec(line)
      if (!match) continue
      const [term, value] = match.slice(1)

      if (term === 'Device') {
        if (currentDevice.device !== undefined) reset()
        currentDevice.device = parseInt(value, 10)
        console.debug('  device=%o', currentDevice.device)
      } else if (term === 'Epoch') {
        if (currentDevice.epoch !== undefined) reset()
        currentDevice.epoch = parseInt(value, 10)
        console.debug('  epoch=%o', currentDevice.epoch)
      } else if (term === 'Votes') {
        if (currentDevice.votes !== undefined) reset()
        currentDevice.votes = value.split(',').map((n) => parseInt(n, 10))
        console.debug('  votes=%o', currentDevice.votes)
      } else {
        console.error('Unknown term %s=%o', term, value)
      }

      if (
        currentDevice.device !== undefined &&
        currentDevice.epoch !== undefined &&
        currentDevice.votes !== undefined
      ) {
        console.debug('Found poster %O', currentDevice)
        append(
          inputFile,
          JSON.stringify({ ...currentDevice, poster: null }) + '\n'
        )
        currentDevice = {}
      }
    }
  })

  // Append to the file
}

let writeQueue = Promise.resolve()
export function append(file: string, text: string) {
  writeQueue = writeQueue.then(() => {
    console.debug('append', text)
    return appendFile(file, text)
  })
}

interface SerialDevice {
  device: number
  epoch: number
  votes: [number, number, number, number, number]
  poster?: number
}

export async function bulkInsert(inputFile: string) {
  setupEnvironment(process.env.NODE_ENV ?? 'production')
  checkEnvironment()
  const knex = dbFromEnvironment()

  // Read in all the values from the ndjson
  // This is not idomatic use of ndjson but it works ok
  const records: SerialDevice[] = []
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(inputFile)
    // Parse each ndjson line and store the record
    stream.pipe(ndjson.parse()).on('data', (r) => records.push(r))

    // Resolve/reject the promise based on the stream
    stream.on('close', () => resolve())
    stream.on('error', (err) => reject(err))
  })

  // Check the user entered poster ids
  if (records.some((r) => r.poster === null)) {
    console.error('not all "poster" ids are set')
    process.exit(1)
  }

  // Run all queries in a transaction so they rollback if one fails
  await knex.transaction(async (trx) => {
    const queries = makeQueries(trx)

    for (const record of records) {
      // Fetch the poster and assert it exists
      const posterId = record.poster!
      const poster = await queries.posterWithOptions(posterId)
      if (!poster) throw new Error(`Poster not found '${posterId}'`)

      // Assign the device to the poster
      const { devicePosterId } = await queries.assignDevice(
        record.device,
        poster.id
      )

      // Store the initial device counts
      await queries.storeDeviceVotes(poster, record.votes, devicePosterId)
    }
  })

  await knex.destroy()
}
