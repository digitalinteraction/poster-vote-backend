/*
 *  These are the miscellaneous routes of the server
 */

import { RouteContext } from '../types'

// GET: /
export function hello({ api }: RouteContext) {
  api.sendData('Hello, World!')
}
