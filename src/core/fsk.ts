/*
 *  A class for running the FSK binary on an audio file
 *   - Also places the audio file in the upload directory uploads/
 */

import fs from 'fs'
import { join, extname } from 'path'
import download from 'download'
import childProc from 'child_process'
import { promisify } from 'util'

const exec = promisify(childProc.exec)

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
  const filename = new Date().toISOString() + (extname(path) || '.wav')

  // Download the file into our fsk directory
  await download(path, uploadDir, { filename })

  // Execute the fsk binary with the local file
  let { stdout } = await exec(
    `cat ${uploadDir}/${filename} | ${process.env.FSK_CMD}`
  )

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
