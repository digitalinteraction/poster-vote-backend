import { RouteContext, Device, Poster } from 'src/types'

import { processFile } from 'src/core/fsk'

import * as express from 'express'
import { twiml } from 'twilio'

const publicUrl = process.env.PUBLIC_URL!

function setupForTwiml(res: express.Response) {
  res.header('content-type', 'text/xml')
  res.header('Cache-Control', 'no-store, must-revalidate, max-age=0')
  res.header('Pragma', 'no-cache')
  res.header('Content-Type', 'application/xml')
}

const ivrUrl = (path: string) => `${process.env.PUBLIC_URL!}/api/ivr/${path}`

// api/ivr/register/twiml
export function registerStart({ res }: RouteContext) {
  setupForTwiml(res)

  let response = new twiml.VoiceResponse()
  let gather = response.gather({
    method: 'GET',
    action: ivrUrl('register/submit'),
    timeout: 10
  })

  gather.say(
    'Welcome to poster vote device registration. Please enter the poster number followed by the pound sign.'
  )

  res.send(response.toString())
}

// api/ivr/register/device
export async function registerWithDevice({ req, res, knex }: RouteContext) {
  setupForTwiml(res)

  // Start a twiml response
  let response = new twiml.VoiceResponse()
  let posterId = req.query.Digits as string

  // Fail if there isn't a ?Digits url parameter
  if (!posterId) {
    response.say('No poster entered, please try again.')
    return res.send(response.toString())
  }

  // Tell them what they entered
  response.say(`You entered ${posterId}.`)

  // Find the associated poster
  let poster: Poster = await knex('posters')
    .where({ code: posterId })
    .first()

  // Fail if we can't find a poster
  if (!poster) {
    response.say(`We couldn't find that poster, please try again.`)
    return res.send(response.toString())
  }

  // Give them instructions
  response.say(
    'After the beep place the bottom of your phone close to the speaker and press the first two buttonns at the same time'
  )

  // Ask them to record a sound
  let record = response.record({
    action: ivrUrl(`register/finish/${poster.id}`),
    method: 'GET',
    playBeep: true,
    maxLength: 23,
    timeout: 23,
    trim: 'do-not-trim',
    finishOnKey: '#'
  })

  // Fail if they didn't record anything
  response.say('No recording, please try again')

  // Return the twiml
  res.send(response.toString())
}

// api/ivr/register/finish/:poster_id?RecordingUrl
export async function registerFinish({ req, res, knex }: RouteContext) {
  setupForTwiml(res)

  let posterId = parseInt(req.params.poster_id, 10)
  let recordingUrl = req.query.RecordingUrl as string

  let response = new twiml.VoiceResponse()

  if (Number.isNaN(posterId) || !recordingUrl) {
    response.say('Something went wrong, please try again.')
    return res.send(response.toString())
  }

  try {
    let result = await processFile(recordingUrl)
    response.say(JSON.stringify(result))
    res.send(response.toString())
  } catch (error) {
    response.say(`We couldn't processes that, please try again`)
    return res.send(response.toString())
  }
}
