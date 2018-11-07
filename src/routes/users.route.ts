import { RouteContext } from 'src/types'
import { cookieName } from 'src/const'
import { BadParams, Redirect } from 'src/core/errors'
import { isEmail, hashEmail, sendgrid } from 'src/core/emails'
import { jwtSign, jwtVerify } from 'src/core/jwt'

export async function me({ api, jwt }: RouteContext) {
  api.sendData(jwt)
}

export async function request({ req, res, api }: RouteContext) {
  type ParamsType = { email: string }
  let { email } = BadParams.check<ParamsType>(req.body, { email: 'string' })

  email = email.toLowerCase()
  if (!isEmail(email)) throw BadParams.shouldBe('email', 'email')
  let hashed = hashEmail(email)

  let token = jwtSign({ usr: hashed })

  let loginUrl = `${process.env.PUBLIC_URL}/check?token=${token}`
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
  type ParamsType = { token: string }
  let { token } = BadParams.check<ParamsType>(req.query, { token: 'string' })

  let { usr } = jwtVerify(token) as any

  res.cookie(cookieName, jwtSign({ usr }), { signed: true })

  throw new Redirect('/')
}

export function logout({ req, res }: RouteContext) {
  res.clearCookie(cookieName)
  throw new Redirect('/')
}
