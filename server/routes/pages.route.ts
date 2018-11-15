import { RouteContext } from 'server/types'
import { Redirect } from 'server/core/errors'
import { Table } from 'server/const'

export function home({ jwt, res, req }: RouteContext) {
  // if (jwt) throw new Redirect('/posters')

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
