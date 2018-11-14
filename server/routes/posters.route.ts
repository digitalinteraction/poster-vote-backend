import * as Knex from 'knex'
import { RouteContext, Poster, PosterOption } from 'server/types'
import { NotFound, BadParams, BadAuth } from 'server/core/errors'

type PosterWithOptions = Poster & { options: PosterOption[] }

// GET api/posters
export async function index({ api, knex, jwt }: RouteContext) {
  if (!jwt) return api.sendData([])

  let query = {
    creator_hash: jwt.usr,
    active: true
  }

  let posters = await knex('posters').where(query)

  api.sendData(posters)
}

// GET api/posters/:id
export async function show({ req, api, knex, jwt, queries }: RouteContext) {
  if (!jwt) return api.sendData([])

  let poster = await queries.posterWithOptions(parseInt(req.params.id, 10))
  if (!poster) throw new NotFound('poster not found')

  api.sendData(poster)
}

// POST api/posters
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

  let { owner = null, contact = null, colour = '7E7F9A' } = req.body

  let allCodes: number[] = await knex('posters').pluck('code')

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

  api.sendData(poster)
}

// DELETE api/posters
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

// GET api/posters/:id/votes
export async function votes({ req, api, queries }: RouteContext) {
  let id = parseInt(req.params.id, 10)
  if (Number.isNaN(id)) throw BadParams.shouldBe('id', 'number')

  // Fetch & send the votes
  api.sendData(await queries.posterVotes(id))
}
