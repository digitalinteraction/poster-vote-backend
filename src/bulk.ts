import { open, readFile } from 'fs/promises'

import { SerialPort } from 'serialport'

interface CurrentDevice {
  device?: number
  epoch?: number
  votes?: number[]
}

// TODO: it needs to "flush" the write?

export async function bulkAppend(inputFile: string, device: string) {
  const output = await open(inputFile, 'a')

  // Create a connection through USB
  const port = new SerialPort({ path: device, baudRate: 2400 }, (err) => {
    if (err) {
      console.error('SerialPort error')
      console.error(err)
      process.exit(1)
    }

    console.debug('open')
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
        console.debug('device=%o', currentDevice.device)
      } else if (term === 'Epoch') {
        if (currentDevice.epoch !== undefined) reset()
        currentDevice.epoch = parseInt(value, 10)
        console.debug('epoch=%o', currentDevice.epoch)
      } else if (term === 'Votes') {
        if (currentDevice.votes !== undefined) reset()
        currentDevice.votes = value.split(',').map((n) => parseInt(n, 10))
        console.debug('votes=%o', currentDevice.votes)
      } else {
        console.error('Unknown term %s=%o', term, value)
      }

      if (
        currentDevice.device !== undefined &&
        currentDevice.epoch !== undefined &&
        currentDevice.votes !== undefined
      ) {
        console.debug('Found poster %O', currentDevice)
        output.write(JSON.stringify(currentDevice) + '\n')
        // ...
        currentDevice = {}
      }
    }
  })

  // Append to the file
}

export async function bulkInsert(inputFile: string, device: string) {
  const file = await readFile(inputFile, 'utf8')
  // const data = file.
}
