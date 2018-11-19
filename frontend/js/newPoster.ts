import { h, onEvent, bindEffect, bindInput } from './dom'
import { makeState, useEffect } from './observable'
import { ApiClient } from './ApiClient'

type Fsm = 'input' | 'working'

let posterClient = new ApiClient()

type ApiEnvelope<T> = {
  meta: { success: boolean; messages: string[] }
  data?: T
}

type Poster = {
  id: number
}

const state = makeState({
  fsm: 'input' as Fsm,
  messages: [] as string[],
  name: '',
  question: '',
  colour: '',
  owner: '',
  contact: '',
  options: ['', '', '', '', '']
})

bindInput('#nameInput', state, 'name')
bindInput('#questionInput', state, 'question')
bindInput('#colourInput', state, 'colour')
bindInput('#ownerInput', state, 'owner')
bindInput('#contactInput', state, 'contact')

bindEffect('#submitPoster', state, (button: HTMLButtonElement, state) => {
  const hasOptions = state.options.filter(o => o).length > 1
  button.disabled =
    state.fsm !== 'input' ||
    !state.name ||
    !state.colour ||
    !state.question ||
    !hasOptions
})

bindEffect('#messages', state, (elem: HTMLElement, state) => {
  elem.style.display = state.messages.length === 0 ? 'none' : null
})

bindEffect('#messages .message-body ul', state, (elem, state) => {
  elem.innerHTML = ''
  state.messages.forEach(message => {
    elem.appendChild(h('li', {}, message))
  })
})

bindEffect('#dev', state, (elem, state) => {
  elem.textContent = JSON.stringify(state, null, 2)
})

onEvent('.poster-option', 'input', (e, elem: HTMLInputElement) => {
  if (!elem.dataset.option) return
  const option = parseInt(elem.dataset.option, 10)
  const newOptions = Array.from(state.options)
  newOptions.splice(option, 1, elem.value)
  state.options = newOptions
})

onEvent('#submitPoster', 'click', async (e, elem) => {
  state.fsm = 'working'

  const { name, question, colour, owner, contact, options } = state

  const { meta, data } = await posterClient.post<Poster>('posters', {
    name,
    question,
    colour,
    owner,
    contact,
    options
  })

  if (meta.success && data) {
    window.location.href = `/posters/${data.id}`
  } else {
    state.fsm = 'input'
    state.messages = meta.messages
  }
})
