/*
 *  These are the poster management routes of the server
 */

import { RouteContext, Poster } from '../types'
import { posterAssetDir, Table } from '../const'
import { NotFound, BadParams, BadAuth } from '../core/errors'
import PDFDocument = require('pdfkit')
import { join } from 'path'

function preparePoster(poster: Poster) {
  let url = `${process.env.API_URL!}/posters/${poster.id}/print.pdf`
  ;(poster as any).pdf_url = url
}

// GET /posters
export async function index({ api, knex, jwt }: RouteContext) {
  if (!jwt) return api.sendData([])

  let query = {
    creator_hash: jwt.usr,
    active: true
  }

  let posters = await knex('posters').where(query)

  posters.forEach(preparePoster)

  api.sendData(posters)
}

// GET /posters/:id
export async function show({ req, api, queries }: RouteContext) {
  let poster = await queries.posterWithOptions(parseInt(req.params.id, 10))
  if (!poster) throw new NotFound('poster not found')

  preparePoster(poster)

  api.sendData(poster)
}

// POST /posters
export async function create({ req, api, knex, jwt, queries }: RouteContext) {
  if (!jwt) throw new BadAuth()

  type Params = { name: string; question: string; options: string[] }
  let { name, question, options } = BadParams.check<Params>(req.body, {
    name: 'string',
    question: 'string',
    options: 'object'
  })

  if (!Array.isArray(options) || options.some(o => typeof o !== 'string')) {
    throw BadParams.shouldBe('options', 'string[]')
  }

  // if (options.some(o => o.length >= 30)) {
  //   throw new BadParams([ 'options should be less than 30 letters' ])
  // }

  let { owner = null, contact = null, colour = '#7E7F9A' } = req.body

  let allCodes: number[] = await knex('posters').pluck('code')

  colour = colour.replace('#', '')

  let code: number
  do {
    code = Math.floor(Math.random() * 999999)
  } while (allCodes.includes(code))

  let poster = await knex.transaction(async trx => {
    const [id] = await trx('posters').insert({
      name,
      question,
      code,
      colour,
      owner,
      contact,
      creator_hash: jwt!.usr
    })

    let optionRecords = options.map((option, value) => ({
      text: option,
      value: value + 1,
      poster_id: id
    }))

    await trx('poster_options').insert(optionRecords)

    return await queries.with(trx).posterWithOptions(id)
  })

  if (poster) preparePoster(poster)

  api.sendData(poster)
}

// DELETE /posters/:id
export async function destroy({ req, jwt, knex, api }: RouteContext) {
  if (!jwt) throw new BadAuth()

  let query = {
    id: parseInt(req.params.id),
    creator_hash: jwt.usr,
    active: true
  }

  await knex('posters')
    .where(query)
    .update({ active: false })

  api.sendData('ok')
}

// GET /posters/:id/votes
export async function votes({ req, api, knex, queries }: RouteContext) {
  let id = parseInt(req.params.id, 10)
  if (Number.isNaN(id)) throw BadParams.shouldBe('id', 'number')

  let updatedResult = await knex(Table.posterOption)
    .max({ max: 'device_counts.created_at' })
    .innerJoin(
      Table.deviceCount,
      'device_counts.poster_option_id',
      'poster_options.id'
    )
    .where('poster_options.poster_id', id)
    .groupBy('poster_options.poster_id')

  // Fetch & send the votes
  api.sendData({
    lastUpdate: updatedResult[0] ? updatedResult[0].max : null,
    votes: await queries.posterVotes(id)
  })
}

// GET /posters/:id/print.pdf
export async function print({ req, res, queries }: RouteContext) {
  let poster = await queries.posterWithOptions(parseInt(req.params.id, 10))
  if (!poster) throw new NotFound('poster not found')

  /** Converts mm to pdf points */
  const convert = (mm: number) => (mm / 25.4) * 72

  const width = 842.4 - convert(10)
  const height = 597.6 - convert(10)

  const doc = new PDFDocument({
    size: [height, width],
    autoFirstPage: false,
    margin: 0,
    layout: 'landscape'
  })

  doc.pipe(res)

  //
  // Front page
  //
  doc.addPage()

  // Background colour
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#' + poster.colour)

  // Background image
  doc.image(join(posterAssetDir, 'front.png'), 0, 0, { width, height })

  // Question text
  doc.fill('white')
  doc.fontSize(32)
  doc.text(poster.question, convert(8.6), convert(8.6), {
    width: convert(129.8),
    lineBreak: true
  })

  // Options text
  doc.fontSize(16)
  let optionY = convert(18.6) - 16 / 3
  poster.options.forEach(option => {
    doc.text(option.text, convert(152.1), optionY, {
      width: convert(110),
      lineBreak: false
    })
    optionY += convert(30)
  })

  // Disclaimer text
  doc.fontSize(12)
  doc.text(
    `This is a PosterVote, a digital poster where you can press the buttons to cast your vote.`,
    convert(14.4),
    convert(106.5),
    {
      width: convert(123),
      lineBreak: true
    }
  )

  // Call-in text
  doc.fontSize(15)
  doc.text(`Call `, convert(29.7), convert(132.4), {
    width: convert(110),
    continued: true
  })
  doc.text(process.env.VOTE_TWILIO_NUMBER!, {
    continued: true,
    underline: true
  })
  doc.text(
    ' to see how people have been voting, placing your phone over the hashed area to record votes.',
    {
      underline: false
    }
  )

  // Owner text
  doc.fontSize(15)
  doc.text('Poster created by ', convert(8.6), convert(182), {
    continued: true
  })
  doc.text(poster.owner || 'PosterVote', { underline: true })
  doc.text('for more information contact ', {
    continued: true,
    underline: false
  })
  doc.text(poster.contact || 'openlab@ncl.ac.uk', { underline: true })

  // Website text
  doc.fontSize(16)
  const link = process.env.WEB_URL!.replace(/https?:\/\//, '')
  const linkText = `Made on ${link}`
  doc.text(
    linkText,
    width - convert(8.6) - doc.widthOfString(linkText),
    height - convert(8.6) - doc.heightOfString(linkText) * 0.5
  )

  //
  // Back page
  //
  const voteUrl = `${process.env.WEB_URL!}/posters/${poster.id}`

  doc.addPage()
  doc.image(join(posterAssetDir, 'back.png'), 0, 0, { width, height })
  doc.fontSize(18)
  doc.fill('#888888')
  doc.list(
    [
      'Print both sides of the poster if you can print two-sided, use "short edge binding"',
      'Attach device to this side of the poster with the buttons facing the paper and the battery folded in',
      `Register the device by calling ${process.env
        .REG_TWILIO_NUMBER!} using code ${poster.code}`,
      'Place poster in desired location to collect votes',
      `Check votes as they are registered at ${voteUrl}`
    ],
    convert(8.6),
    convert(28.7),
    { width: width * 0.7 }
  )

  // Send the page
  doc.end()
}
