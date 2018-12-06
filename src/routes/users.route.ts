import { RouteContext } from '../types'
import { cookieName } from '../const'
import { BadParams, Redirect } from '../core/errors'
import { isEmail, sendgrid } from '../core/emails'
import { jwtSign, jwtVerify, makeUserJwt } from '../core/jwt'

// Note: its safe to cast because they are required environment variables
const apiUrl = process.env.API_URL as string
const webUrl = process.env.WEB_URL as string

export async function me({ api, jwt }: RouteContext) {
  api.sendData({ usr: jwt ? jwt.usr : null })
}

export async function request({ req, res, api }: RouteContext) {
  type Params = { email: string }
  let { email } = BadParams.check<Params>(req.body, { email: 'string' })

  if (!isEmail(email)) throw BadParams.shouldBe('email', 'email')

  let token = makeUserJwt(email)

  let loginUrl = `${apiUrl}/check?token=${token}`
  let [username] = email.split('@')

  let emailHtml = await new Promise<string>((resolve, reject) => {
    res.render('emails/login', { username, loginUrl }, (err, html) => {
      if (err) reject(err)
      else resolve(html)
    })
  })

  await sendgrid.send({
    to: email,
    from: process.env.ADMIN_EMAIL!,
    subject: 'PosterVote login',
    text: `Hey ${username},\nhere is your login link:\n${loginUrl}\n\nEnjoy!`,
    html: emailHtml
  })

  api.sendData('ok')
}

export function check({ req, res }: RouteContext) {
  type Params = { token: string }
  let { token } = BadParams.check<Params>(req.query, { token: 'string' })

  let { usr } = jwtVerify(token) as any

  res.cookie(cookieName, jwtSign({ usr }), { signed: true })

  throw new Redirect(webUrl + '/posters')
}

export function logout({ res }: RouteContext) {
  res.clearCookie(cookieName)
  throw new Redirect('/')
}
