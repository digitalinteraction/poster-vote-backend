import { RouteContext } from 'src/types'

export function home({ jwt, res, req }: RouteContext) {
  res.render('pages/home', {
    title: 'PosterVote v4',
    message: 'Hello, World!'
  })
}
