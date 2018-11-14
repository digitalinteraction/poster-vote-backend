type EventCallback<T extends Event, U extends Element> = (e: T, elem: U) => void

/** Register event listeners on a query selector */
export function on<T extends Event = Event, U extends Element = Element>(
  selector: string,
  eventName: string,
  handler: EventCallback<T, U>
) {
  document.querySelectorAll(selector).forEach(elem => {
    elem.addEventListener(eventName, e => handler(e as T, elem as U))
  })
}

export const isEmail = (str: string) => /^\S+@\S+$/.test(str)

// type R<E extends Element> = [string, number]

export function bind<E extends Element, S extends object>(
  id: string,
  initial: S,
  update: (elem: E, state: S) => void
): [E, S] {
  const elem: E = document.getElementById(id) as any
  if (!elem) throw new Error(`Invalid element #${id}`)

  const state = Object.assign({}, initial)
  const boundState: any = {}

  const updateElem = () => update(elem, boundState)

  for (let key in initial) {
    Object.defineProperty(boundState, key, {
      get: () => state[key],
      set: (v: any) => ((state[key] = v), updateElem())
    })
  }

  updateElem()

  return [elem, boundState]
}

export function bind2<E extends Element, S>(id: string, state: S) {
  const elem: E = document.getElementById(id) as any
  if (!elem) throw new Error(`Invalid element #${id}`)
}
