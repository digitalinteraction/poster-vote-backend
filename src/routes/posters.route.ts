import * as Knex from 'knex'
import { RouteContext, Poster, PosterOption } from 'src/types'
import { NotFound, BadParams, BadAuth } from 'src/core/errors'

type PosterWithOptions = Poster & { options: PosterOption[] }

const fetchPoster = async (
  knex: Knex,
  id: number
): Promise<PosterWithOptions | null> => {
  let poster = await knex('posters')
    .where({ id, active: true })
    .first()

  if (!poster) return null

  poster.options = await knex('poster_options').where('poster_id', poster.id)

  return poster
}

export async function index({ api, knex, jwt }: RouteContext) {
  if (!jwt) return api.sendData([])

  let query = {
    creator_hash: jwt.usr,
    active: true
  }

  let posters = await knex('posters').where(query)

  api.sendData(posters)
}

export async function show({ req, api, knex, jwt }: RouteContext) {
  if (!jwt) return api.sendData([])

  let poster = await fetchPoster(knex, parseInt(req.params.id, 10))
  console.log(poster)
  if (!poster) throw new NotFound('poster not found')

  api.sendData(poster)
}

export async function create({ req, api, knex, jwt }: RouteContext) {
  if (!jwt) throw new BadAuth()
  type Params = { question: string; options: string[] }
  let { question, options } = BadParams.check<Params>(req.body, {
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

    return await fetchPoster(trx, id)
  })

  api.sendData(poster)
}

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
