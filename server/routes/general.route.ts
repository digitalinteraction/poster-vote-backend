import { RouteContext } from 'server/types'

export function hello({ api }: RouteContext) {
  api.sendData('Hello, World!')
}
