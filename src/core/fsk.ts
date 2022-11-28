/*
 *  A class for running the FSK binary on an audio file
 *   - Also places the audio file in the upload directory uploads/
 */

import fs from 'fs'
import { join, extname } from 'path'
import child from 'child_process'
import fetch from 'node-fetch'

const uploadDir = join(__dirname, '../../uploads/fsk')

export function setupFskDirectories() {
  try {
    fs.statSync(uploadDir)
  } catch (error) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
}

type VoteResult = {
  uuid: number
  votes: number[]
}

export async function processFskFile(path: string): Promise<VoteResult> {
  const req = await fetch(path)
  if (!req.ok || !req.body) throw new Error('Unable to download file')

  const stdout = await new Promise<string>((resolve, reject) => {
    const proc = child.exec(process.env.FSK_CMD!)
    req.body.pipe(proc.stdin!)

    const output: string[] = []
    proc.on('close', (code) => {
      if (code !== 0) reject(code)
      else resolve(output.join(''))
    })
    proc.stdout!.on('data', (chunk) => {
      output.push(chunk)
    })
  })

  let [status, deviceId, ...votes] = stdout.trim().split(',')

  if (status !== 'VOTES') {
    throw new Error('Failed to parse audio')
  }

  return {
    uuid: parseInt(deviceId, 10),
    votes: votes.map((str) => parseInt(str, 10)),
  }
}

// processFskFile('http://postervote.co.uk/upload/20150813085522.wav')
//   .then(v => console.log(v))
//   .catch(err => console.log(err))
