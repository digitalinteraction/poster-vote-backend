import { RouteContext } from 'src/types'

export function hello({ api }: RouteContext) {
  api.sendData('Hello, World!')
}
