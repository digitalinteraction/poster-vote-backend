import * as jwtParser from 'express-jwt'
import * as jwt from 'jsonwebtoken'

import { cookieName } from '../const'
import { hashEmail } from '../core/emails'

/** Config for express-jwt to optionally verify a token from the request */
export const jwtParserConfig: jwtParser.Options = {
  secret: process.env.JWT_SECRET!,
  credentialsRequired: false,
  getToken(req) {
    let { headers = {}, signedCookies = {}, query = {} } = req

    // Try a signed cookie
    if (signedCookies[cookieName]) {
      return req.signedCookies[cookieName]
    }

    // Try an auth header, Authorization: Bearer
    if (headers.authorization && headers.authorization.startsWith('Bearer ')) {
      return headers.authorization.split(' ')[1]
    }

    // Try the query string, ?token=
    if (query.token) return query.token
    return null
  }
}

// (v) Utilities to wrap the use of JWT_SECRET!

export function jwtSign(payload: string | object | Buffer): string {
  return jwt.sign(payload, process.env.JWT_SECRET!)
}

export function jwtVerify(token: string): string | object {
  return jwt.verify(token, process.env.JWT_SECRET!)
}

export function makeUserJwt(email: string): string {
  return jwtSign({
    usr: hashEmail(email.toLowerCase())
  })
}
