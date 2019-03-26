/*
 *  These are the user and authentication routes of the server
 */

import { RouteContext } from '../types'
import { cookieName } from '../const'
import { Redirect } from '../core/errors'

// GET: /auth/me
export async function me({ sendData, jwt }: RouteContext) {
  sendData({ usr: jwt ? jwt.sub : null })
}

// POST: /auth/logout
export function logout({ res }: RouteContext) {
  res.clearCookie(cookieName)
  throw new Redirect('/')
}
