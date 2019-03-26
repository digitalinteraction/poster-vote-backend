/*
 *  Utility functions for creating & verifying Json web tokens (jwt)
 */

// import * as jwtParser from 'express-jwt'
import * as jwt from 'jsonwebtoken'
import { hashEmail } from '../core/emails'

// Utilities to wrap the use of JWT_SECRET!

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
