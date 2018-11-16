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

const isObservableSymbol = Symbol('Observed.isObservable')
const nextEffectSymbol = Symbol('Observed.nextEffect')
const effectsSymbol = Symbol('Observed.effects')

type Stateful = {
  [idx: string]: any
}
type Effect<S extends Stateful> = (state: S) => void
type EffectMap<S extends Stateful> = { [K in keyof S]: Effect<S>[] }

type Observable<S extends Stateful> = S & {
  [isObservableSymbol]: boolean
  [nextEffectSymbol]?: Effect<S>
  [effectsSymbol]: EffectMap<S>
}

export function withObservable<S extends Stateful, U>(
  state: S,
  block: (o: Observable<S>) => U
): U | undefined {
  if ((state as Observable<S>)[isObservableSymbol] !== true) return
  return block(state as any)
}

export function makeState<S extends Stateful>(initial: S): S {
  // Create an object to store effects
  let effects: EffectMap<S> = {} as any
  for (let key in initial) effects[key] = []

  // Create our new state, with the effects
  let base = {
    [isObservableSymbol]: true,
    [effectsSymbol]: effects
  }
  let state: Observable<S> = Object.assign(base, initial)

  // Create a proxy to register effects
  let proxy = new Proxy(state as S, {
    get(target: S, prop: keyof S) {
      // Register the effect
      withObservable(target, state => {
        const nextEffect = state[nextEffectSymbol]
        const effects = state[effectsSymbol][prop]
        if (!nextEffect || !effects || effects.includes(nextEffect)) return
        effects.push(nextEffect)
      })
      return (target as any)[prop]
    },
    set(target, prop: keyof S, value) {
      target[prop] = value

      withObservable(target, state => {
        const effects = state[effectsSymbol][prop] || []
        effects.forEach(effect => effect(target))
      })

      return true
    }
  })

  return proxy
}

export function useEffect<S extends Stateful>(state: S, effect: Effect<S>) {
  withObservable(state, observed => {
    observed[nextEffectSymbol] = effect
    effect(state)
    delete observed[nextEffectSymbol]
  })
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

/*
 * ==== DEPRECATED ====
 */

/* Observable Utils */

export function withEffects<S extends Stateful, U>(
  state: S,
  prop: keyof S,
  block: (effects: Effect<S>[]) => U
) {
  return withObservable(state, state => {
    const effects = state[effectsSymbol][prop]
    return effects && block(effects)
  })
}

export function withNextEffect<S extends Stateful, U>(
  state: S,
  block: (effect: Effect<S>) => U
) {
  return withObservable(state, state => {
    const effect = state[nextEffectSymbol]
    return effect && block(effect)
  })
}

/* Computed Props */

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

/* Finite State Machines */

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
    delete (state as any)[nextEffectSymbol]
    fsm[current!].enter()
  })
}
