import { Stateful, makeState, useEffect } from './observable'

declare global {
  namespace JSX {
    interface Element extends HTMLElement {}
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

/** Register event listeners on elements that match a query selector */
export function onEvent<T extends Event = Event, U extends Element = Element>(
  selector: string,
  eventName: string,
  handler: (e: T, elem: U) => void
) {
  document.querySelectorAll(selector).forEach(elem => {
    elem.addEventListener(eventName, e => handler(e as T, elem as U))
  })
}

/** Whether a string is (roughly) an email */
export const isEmail = (str: string) => /^\S+@\S+$/.test(str)

/*
 * Stateful DOM
 */

/** A util to fetch a dom element or throw an error */
function queryElemOrError<E extends Element>(selector: string): E {
  let elem = document.querySelector(selector)
  if (!elem) throw new Error(`'${selector}' not found`)
  return elem as E
}

/** Fetches an element and creates a state effect with it */
export function bindEffect<E extends Element, S extends Stateful>(
  selector: string,
  state: S,
  effect: (elem: E, state: S) => void
) {
  let elem = queryElemOrError<E>(selector)
  useEffect(state, state => effect(elem, state))
}

/** Binds the value of an input to the state */
export function bindInput<
  E extends HTMLInputElement,
  S extends Stateful,
  K extends keyof S
>(selector: string, state: S, key: K) {
  let elem = queryElemOrError<E>(selector)

  // Set the state from the input's value
  state[key] = elem.value

  // Set the input's value when the state changes
  useEffect(state, state => {
    elem.value = state[key]
  })

  // Set the states's value when the input changes
  elem.addEventListener('input', e => {
    state[key] = elem.value
  })
}

/** JSX factory function for rendering dom elements / custom components */
export function h(elem: any, attrs: object = {}, ...children: any[]) {
  if (typeof elem === 'string') return domRender(elem, attrs, ...children)
  if (typeof elem === 'function') return elem(attrs, ...children)
  throw new Error(`Unknown element '${elem}'`)
}

/** Creates a dom element from a type, set of attributes and child nodes */
function domRender(name: string, attrs: any, ...children: any[]): HTMLElement {
  let elem = document.createElement(name)

  // Set attributes on the element
  for (let prop in attrs) elem.setAttribute(prop, attrs[prop])

  // Add children to the element
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

/*
 * ==== DEPRECATED ====
 */

/* Observable Utils */

// export function withEffects<S extends Stateful, U>(
//   state: S,
//   prop: keyof S,
//   block: (effects: Effect<S>[]) => U
// ) {
//   return withObservable(state, state => {
//     const effects = state[effectsSymbol][prop]
//     return effects && block(effects)
//   })
// }
//
// export function withNextEffect<S extends Stateful, U>(
//   state: S,
//   block: (effect: Effect<S>) => U
// ) {
//   return withObservable(state, state => {
//     const effect = state[nextEffectSymbol]
//     return effect && block(effect)
//   })
// }

/* Computed Props */

// type Computed<S, V> = (state: S) => V
// type ComputedDef<S extends Stateful, C> = { [K in keyof C]: Computed<S, C[K]> }
//
// export function computeProps<S extends Stateful, C extends Stateful>(
//   state: S,
//   computed: ComputedDef<S, C>
// ): C {
//   let computedState = {} as C
//
//   for (let key in computed) {
//     useEffect(state, state => {
//       computedState[key] = computed[key](state)
//     })
//   }
//
//   computedState = makeState(computedState)
//
//   return computedState
// }

/* Finite State Machines */

// export type FinateState = {
//   enter(): void
//   leave(): void
// }
//
// type Enum = { [idx: string]: string }
// export type FsmDef<F extends string> = { [K in F]: FinateState }
//
// export function makeFsm<S extends Stateful, K extends keyof S, F extends S[K]>(
//   state: S,
//   key: K,
//   fsm: FsmDef<F>
// ) {
//   let current: S[K] | undefined
//   useEffect(state, state => {
//     if (current) fsm[current].leave()
//     current = state[key]
//     delete (state as any)[nextEffectSymbol]
//     fsm[current!].enter()
//   })
// }
