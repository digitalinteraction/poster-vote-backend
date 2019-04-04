/*
 *  Utility functions for creating & verifying Json web tokens (jwt)
 *  -> Also wrapping the use of process.env.JWT_SECRET
 */

import * as jwt from 'jsonwebtoken'

export function jwtSign(payload: string | object | Buffer): string {
  return jwt.sign(payload, process.env.JWT_SECRET!)
}

export function jwtVerify(token: string): string | object {
  return jwt.verify(token, process.env.JWT_SECRET!)
}

import crypto from 'crypto'

/** Securely hash an email to be stored / checked */
export const hashEmail = (email: string) =>
  crypto
    .createHash('sha256')
    .update(email)
    .digest('base64')

export function makeUserJwt(email: string): string {
  return jwtSign({
    usr: hashEmail(email.toLowerCase())
  })
}
