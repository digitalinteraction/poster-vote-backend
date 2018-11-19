import { RouteContext } from 'server/types'
import { Redirect } from 'server/core/errors'
import { Table } from 'server/const'

export function home({ jwt, res, req }: RouteContext) {
  res.render('pages/home', {
    title: 'Home',
    loggedIn: jwt !== undefined
  })
}

export async function posters({ res, jwt, knex }: RouteContext) {
  if (!jwt) throw new Redirect('/')

  const posters = await knex(Table.poster)
    .where('creator_hash', jwt.usr)
    .where('active', true)

  res.render('pages/posters', {
    title: 'Posters',
    posters
  })
}

export async function addPoster({ res, jwt, knex }: RouteContext) {
  if (!jwt) throw new Redirect('/')

  let randomColour = Math.floor(Math.random() * 16777215).toString(16)
  while (randomColour.length < 6) randomColour = '0' + randomColour

  res.render('pages/newPoster', {
    title: 'New Poster',
    randomColour: '#' + randomColour
  })
}
