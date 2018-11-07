import { RouteContext } from 'src/types'

export function home({ jwt, res, req }: RouteContext) {
  console.log(req.signedCookies)

  res.render('pages/index', {
    title: 'PosterVote v4',
    message: 'Hello, World!'
  })
}
