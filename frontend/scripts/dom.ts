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

// type StateDef<T> = { [K in keyof T]: T | ((state: T) => T[K]) }

type ObserverMap<S> = { [K in keyof S]: Observation<S[K]>[] }

type Observation<V> = (value: V) => void

type Binder<T, U> = (state: State<T>) => U

// type BoundState<T, K2 extends string, V> = {
//   [K in keyof T]: T[K],
//   [idx, K2]: V
// }

export class State<T> {
  private internal: T
  public observers: ObserverMap<T> = {} as any

  static create<T>(initial: T): State<T> & T {
    return new State(initial) as any
  }

  constructor(initial: T) {
    this.internal = Object.assign({}, initial)

    for (let key in initial) {
      this.observers[key] = []

      Object.defineProperty(this, key, {
        get() {
          return this.internal
        },
        set(v) {
          this.internal[key] = v
          this.observeChange(key, v)
        }
      })
    }
  }

  private observeChange<K extends keyof T>(key: K, value: any) {
    this.observers[key].forEach(obs => obs(value))
  }

  public observe<K extends keyof T>(key: K, observer: Observation<T[K]>) {
    this.observers[key].push(observer)
  }

  // public bind<K extends string, V>(
  //   key: K,
  //   binder: Binder<T, V>
  // ): State<T> & { K: V } {
  //   return this
  // }
}

// export function makeState<S>(initial: S) {
//
//   let bound: S = {} as any
//   Object.defineProperty(bound, 'state', {
//     writable: true,
//     enumerable: false,
//     value: Object.assign({}, initial)
//   })
//
//   for (let key in initial) {
//     Object.defineProperty(bound, key, {
//       get () {
//         return this.state
//       },
//       set (v) {
//         this.state[key] = v
//         update(elem, this)
//       }
//     })
//   }
// }

export function bind2<E extends Element, S>(
  id: string,
  initial: S,
  update: (elem: E, state: S) => void
) {
  const elem: E = document.getElementById(id) as any
  if (!elem) throw new Error(`Invalid element #${id}`)

  // const s0: S = {} as any
  // for (let key in initial) {
  //   if (typeof initial[key] !== 'function') s0[key] = initial[key] as any
  // }

  // let s0 = Object.assign({}, initial)

  // let reload

  let bound: S = {} as any
  Object.defineProperty(bound, 'state', {
    writable: true,
    enumerable: false,
    value: Object.assign({}, initial)
  })

  for (let key in initial) {
    Object.defineProperty(bound, key, {
      get() {
        return this.state
      },
      set(v) {
        this.state[key] = v
        update(elem, this)
      }
    })
  }

  return [elem, bound]
}
