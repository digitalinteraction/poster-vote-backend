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

type Stateful = { [idx: string]: any }
type Effect<S extends Stateful> = (state: S) => void
type EffectMap<S extends Stateful> = { [K in keyof S]: Effect<S>[] }
type Locks<S extends Stateful> = { [K in keyof S]: boolean }

let isObservable = Symbol('Observed.isObservable')
let nextEffect = Symbol('Observed.nextEffect')

type Observed<S extends Stateful> = S & {
  nextEffect?: Effect<S>
  effects: EffectMap<S>
  // locks: Locks<S>
}

export function withObservable<S extends Stateful, U>(
  state: S,
  block: (o: Observed<S>) => U
): U | undefined {
  if ((state as any)[isObservable] !== true) return
  return block(state as any)
}

// export function withNextEffect<S extends Stateful, U>(
//   state: S,
//   block: (effect: Effect<S>) => U
// ): U | undefined {
//   let effect = (state as any)[nextEffect] as any
//   if (effect === undefined) return
//   return block(state[effect])
// }

export function makeState<S extends Stateful>(initial: S): S {
  // Create an object to store effects
  let effects: EffectMap<S> = {} as any
  for (let key in initial) effects[key] = []

  // Create locks
  // let locks: Locks<S> = {} as any
  // for (let key in initial) locks[key] = false

  // Create our new state, with the effects
  let state: Observed<S> = Object.assign({ effects }, initial)
  ;(state as any)[isObservable] = true

  // Create a proxy to register effects
  let proxy = new Proxy<Observed<S>>(state, {
    get(target: S, prop: keyof S) {
      // Register the effect
      if (
        state.nextEffect &&
        state.effects[prop] &&
        !state.effects[prop].includes(state.nextEffect)
      ) {
        target.effects[prop].push(state.nextEffect)
      }
      return (target as any)[prop]
    },
    set(target: S, prop: keyof S, value) {
      ;(target as any)[prop] = value

      // Trigger effects
      if (state.effects[prop]) {
        state.effects[prop].forEach(effect => effect(target))
      }
      return true
    }
  })

  return proxy
}

type Computed<S, V> = (state: S) => V
type ComputedDef<S extends Stateful, C> = { [K in keyof C]: Computed<S, C[K]> }

export function computeProps<S extends Stateful, C extends Stateful>(
  state: S,
  computed: ComputedDef<S, C>
): C {
  let computedState = {} as C

  for (let key in computed) {
    useEffect(state, state => {
      computedState[key] = computed[key](state)
    })
  }

  computedState = makeState(computedState)

  return computedState
}

export function useEffect<S extends Stateful>(state: S, effect: Effect<S>) {
  withObservable(state, observed => {
    observed.nextEffect = effect
    effect(state)
    observed.nextEffect = undefined
  })
}

export type FinateState = {
  enter(): void
  leave(): void
}

type Enum = { [idx: string]: string }
export type FsmDef<F extends string> = { [K in F]: FinateState }

export function makeFsm<S extends Stateful, K extends keyof S, F extends S[K]>(
  state: S,
  key: K,
  fsm: FsmDef<F>
) {
  let current: S[K] | undefined
  useEffect(state, state => {
    if (current) fsm[current].leave()
    current = state[key]
    fsm[current!].enter()
  })

  // NOTE: Possible issue with first state.enter registering an effect
}

function domRender(name: string, attrs: any, ...children: any[]): HTMLElement {
  let elem = document.createElement(name)
  for (let prop in attrs) {
    elem.setAttribute(prop, attrs[prop])
  }
  for (let i in children) {
    switch (typeof children[i]) {
      case 'string':
        elem.appendChild(document.createTextNode(children[i]))
        break
      default:
        elem.appendChild(children[i])
        break
    }
  }
  return elem
}

export function h(elem: any, attrs: object = {}, ...children: any[]) {
  if (typeof elem === 'string') return domRender(elem, attrs, ...children)
  if (typeof elem === 'function') return elem(attrs, ...children)
  throw new Error(`Unknown element '${elem}'`)
}
