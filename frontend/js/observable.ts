// Symbols for observables
const isObservableSymbol = Symbol('Observed.isObservable')
const nextEffectSymbol = Symbol('Observed.nextEffect')
const effectsSymbol = Symbol('Observed.effects')

export type Stateful = {
  [idx: string]: any
}

type Effect<S extends Stateful> = (state: S) => void

type EffectMap<S extends Stateful> = { [K in keyof S]: Effect<S>[] }

type Observable<S extends Stateful> = S & {
  [isObservableSymbol]: boolean
  [nextEffectSymbol]?: Effect<S>
  [effectsSymbol]: EffectMap<S>
}

/** A util to call a lamda with an observable (only if it is observable) */
export function withObservable<S extends Stateful, U>(
  state: S,
  block: (o: Observable<S>) => U
): U | undefined {
  if ((state as Observable<S>)[isObservableSymbol] !== true) return
  return block(state as any)
}

/** Makes an observable state, ready to be used with #useEffect */
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

        // Add the effect if its not already registered and refers to the state
        effects.push(nextEffect)
      })
      return target[prop]
    },
    set(target, prop: keyof S, value) {
      if (target[prop] === value) return true

      // Set the value if it has changed
      target[prop] = value

      // Trigger any effects that are registered for that key
      withObservable(target, state => {
        const effects = state[effectsSymbol][prop] || []
        effects.forEach(effect => useEffect(proxy, effect))
      })

      return true
    }
  })

  return proxy
}

/**
 * Add an effect to the state using a lamda function
 * - Uses the lamda to work out which state is being bound to
 * - Re-calls the lamba whenever its bit of state change
 */
export function useEffect<S extends Stateful>(state: S, effect: Effect<S>) {
  withObservable(state, observed => {
    observed[nextEffectSymbol] = effect
    effect(state)
    delete observed[nextEffectSymbol]
  })
}
