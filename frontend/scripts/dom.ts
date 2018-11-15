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

type SomeKey = string | number | Symbol

type EffectMap<T> = { [K in keyof T]: Effect[] }
type Effect<T = any> = (state: T) => void

type Observed<T extends object> = T & {
  nextEffect?: Effect<T>
  effects: { [idx: string]: Effect[] }
}

function makeState<T extends object>(initial: T): T {
  // Create an object to store effects
  let effects: EffectMap<T> = {} as any
  for (let key in initial) effects[key] = []

  // Create our new state, with the effects
  let state: Observed<T> = Object.assign({ effects }, initial)

  // Create a proxy to register effects
  let proxy = new Proxy<Observed<T>>(state, {
    get(target: any, prop) {
      // Register the effect
      if (state.nextEffect && prop !== 'nextEffect') {
        target.effects[prop as any].push(target.nextEffect)
        state.nextEffect = undefined
      }
      return target[prop]
    },
    set(target, prop, value) {
      ;(target as any)[prop] = value

      // Trigger effects
      if (target.effects[prop as any]) {
        target.effects[prop as any].forEach(effect => effect(target))
      }
      return true
    }
  })

  return proxy
}

function useEffect<T extends object>(state: T, effect: Effect<T>) {
  ;(state as Observed<T>).nextEffect = effect
  effect(state)
}

let s0 = makeState({ name: 'Geoff', canSubmit: false })

useEffect(s0, state => {
  state.canSubmit = state.name.length > 4
})

useEffect(s0, state => console.log(state.name, state.canSubmit))

s0.name = 'Geoffrey'
s0.name = 'Jim'
s0.name = 'Tom'
