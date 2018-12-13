/*
 *  These are the Twilio IVR endpoints, returning TWIML for text-to-speach
 */

import { RouteContext, Device, Poster, DevicePoster } from '../types'
import { Table } from '../const'

import { processFskFile } from '../core/fsk'

import * as express from 'express'
import { twiml } from 'twilio'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { PosterWithOptions } from '../core/queries'

//-
//- Utils
//-

const submitMsg = `After the beep place the bottom of your phone near the speaker and hold the first two poster buttons until it beeps.`

const ivrUrl = (path: string) => `/ivr/${path}`

const speakableNumber = (number: number) =>
  number
    .toString()
    .split('')
    .join(' ')

function setupForTwiml(res: express.Response) {
  res.header('content-type', 'text/xml')
  res.header('Cache-Control', 'no-store, must-revalidate, max-age=0')
  res.header('Pragma', 'no-cache')
  res.header('Content-Type', 'application/xml')
}

function sendTwiml(res: express.Response, voice: VoiceResponse): void {
  setupForTwiml(res)
  res.send(voice.toString())
}

function makeCountRecords(
  poster: PosterWithOptions,
  votes: number[],
  devicePosterId: number
) {
  let optionIds = poster.options.map(o => o.id)
  return votes
    .filter((_count, index) => optionIds[index])
    .map((count, index) => ({
      value: count,
      poster_option_id: optionIds[index],
      device_poster_id: devicePosterId
    }))
}

//-
//- Register endpoints
//-

// GET /ivr/register/start
export function registerStart({ res }: RouteContext) {
  const voice = new twiml.VoiceResponse()
  const gather = voice.gather({
    method: 'GET',
    action: ivrUrl('register/poster'),
    timeout: 10
  })

  gather.say(
    'Welcome to poster vote device registration. Please enter the poster number followed by the pound sign.'
  )

  voice.say(`I didn't catch that, please try again`)

  voice.redirect({ method: 'GET' }, ivrUrl('register/start'))

  sendTwiml(res, voice)
}

// GET /ivr/register/poster
export async function registerWithDigits({ req, res, knex }: RouteContext) {
  // Start a twiml response
  const voice = new twiml.VoiceResponse()
  const posterId = req.query.Digits && parseInt(req.query.Digits, 10)

  // Fail if there isn't a ?Digits url parameter
  if (posterId === undefined) {
    voice.say('No poster entered, please try again.')
    voice.redirect({ method: 'GET' }, ivrUrl('register/start'))
    return sendTwiml(res, voice)
  }

  // Tell them what they entered
  voice.say(`You entered ${speakableNumber(posterId)}.`)

  // Find the associated poster
  let poster: Poster = await knex(Table.poster)
    .where({ code: posterId })
    .first()

  // Fail if we can't find a poster
  if (!poster) {
    voice.say(`We couldn't find that poster, please try again.`)
    voice.redirect({ method: 'GET' }, ivrUrl('register/start'))
    return sendTwiml(res, voice)
  }

  // Give them instructions
  voice.say(submitMsg)

  // Ask them to record a sound
  voice.record({
    action: ivrUrl(`register/finish/${poster.id}`),
    method: 'GET',
    playBeep: true,
    maxLength: 23,
    timeout: 23,
    trim: 'do-not-trim',
    finishOnKey: '#'
  })

  // Fail if they didn't record anything
  voice.say(`Sorry I didn't catch that, please try again`)

  // Return the twiml
  return sendTwiml(res, voice)
}

// GET /ivr/register/finish/:poster_id?RecordingUrl
export async function registerFinish({
  req,
  res,
  knex,
  queries
}: RouteContext) {
  const posterId = parseInt(req.params.poster_id, 10)
  const recordingUrl = req.query.RecordingUrl as string

  const voice = new twiml.VoiceResponse()

  try {
    if (Number.isNaN(posterId) || !recordingUrl) {
      voice.say('Something went wrong, please try again.')
      voice.redirect({ method: 'GET' }, ivrUrl('register/poster'))
      return sendTwiml(res, voice)
    }

    const poster = await queries.posterWithOptions(posterId)

    if (!poster) {
      voice.say(`We couldn't find that poster, please try again.`)
      // Don't redirect as they can't have got here from twilio
      return sendTwiml(res, voice)
    }

    // Process the audio file
    const { uuid, votes } = await processFskFile(recordingUrl)

    // See if the device already exists
    let device: Device = await knex(Table.device)
      .where({ uuid })
      .first()

    // Create the device if not found
    if (!device) {
      const [id] = await knex(Table.device).insert({ uuid })
      device = await knex(Table.device)
        .select('*')
        .where({ id })
        .first()
    }

    // Create the relation to the poster
    const [devicePosterId] = await knex(Table.devicePoster).insert({
      poster_id: posterId,
      device_id: device.id
    })

    // Store the counts
    await knex(Table.deviceCount).insert(
      makeCountRecords(poster, votes, devicePosterId)
    )

    // Let them know it was a success
    voice.say('Thank you, your device has been registered with that poster.')
  } catch (error) {
    console.log(error)
    voice.say(`Sorry, we couldn't process that, please try again.`)
  }

  return sendTwiml(res, voice)
}

//-
//- Vote endpoints
//-

// GET /ivr/vote/start
export function voteStart({ res }: RouteContext) {
  const voice = new twiml.VoiceResponse()

  voice.say('Welcome to poster vote.')
  voice.say(submitMsg)
  voice.record({
    action: ivrUrl('vote/finish'),
    method: 'GET',
    playBeep: true,
    maxLength: 23,
    timeout: 23,
    trim: 'do-not-trim',
    finishOnKey: '#'
  })

  sendTwiml(res, voice)
}

// GET /ivr/vote/finish
export async function voteFinish({ req, res, knex, queries }: RouteContext) {
  const recordingUrl = req.query.RecordingUrl as string
  const voice = new twiml.VoiceResponse()

  try {
    // Fail if no recording was provided
    if (!recordingUrl) {
      throw new Error('No recording provided')
    }

    // Process the audio
    let { uuid, votes } = await processFskFile(recordingUrl)

    // Fetch the device or fail
    let device: Device = await knex(Table.device)
      .where({ uuid })
      .first()
    if (!device) throw new Error('Device not found')

    // Fetch the relation of fail
    let devicePoster: DevicePoster = await knex(Table.devicePoster)
      .where('device_id', device.id)
      .orderBy('created_at', 'desc')
      .first()
    if (!devicePoster) throw new Error('Poster not registered')

    // Fetch the poster of fail
    let poster = await queries.posterWithOptions(devicePoster.poster_id)
    if (!poster) throw new Error('Poster not found')

    // Store the votes
    await knex(Table.deviceCount).insert(
      makeCountRecords(poster, votes, devicePoster.id)
    )

    // Send sms confirmation with the votes in
    let finalVotes = await queries.posterVotes(poster.id)
    let smsLines = ['PosterVote result:']
    smsLines.push(`Q: ${poster.question}`)
    poster.options.forEach((option, index) => {
      smsLines.push(`${index + 1}. ${option.text} (${finalVotes[index].vote})`)
    })

    // TODO: Add url-shortened link to view poster online

    voice.say(
      `We have recorded the votes and will send you them in an SMS, thank you.`
    )
    voice.sms(smsLines.join('\r\n'))
  } catch (error) {
    console.log(error)
    voice.say(`Sorry, we couldn't process that, starting again.`)
    voice.redirect({ method: 'GET' }, ivrUrl('vote/start'))
  }

  sendTwiml(res, voice)
}
