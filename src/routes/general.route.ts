/*
 *  These are the miscellaneous routes of the server
 */

import { RouteContext } from '../types'

// GET: /
export function hello({ sendData }: RouteContext) {
  sendData('Hello, World!')
}

export function notFound({ sendFail }: RouteContext) {
  sendFail(['Not Found'], 404)
}
