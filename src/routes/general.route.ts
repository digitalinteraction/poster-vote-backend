import { RouteContext } from '../types'

export function hello({ api }: RouteContext) {
  api.sendData('Hello, World!')
}
