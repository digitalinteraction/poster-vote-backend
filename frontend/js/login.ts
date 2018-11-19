import { isEmail, bindEffect, bindInput, onEvent } from './dom'
import { makeState, useEffect } from './observable'
import { ApiClient } from './ApiClient'

const apiClient = new ApiClient()

const loginForm = document.getElementById('loginForm') as HTMLElement
const loginMessage = document.getElementById('loginMessage') as HTMLElement
const emailInput = document.getElementById('loginEmail') as HTMLInputElement

type LoginFsm = 'input' | 'working' | 'success'
type State = { email: string; fsm: LoginFsm }

async function submitLogin(state: State) {
  state.fsm = 'working'
  const { data } = await apiClient.post('users', { email: emailInput.value })
  state.fsm = 'success'
}

if (loginForm && loginMessage && emailInput) {
  const state = makeState<State>({
    email: '',
    fsm: 'input'
  })

  bindInput('#loginEmail', state, 'email')

  bindEffect('#loginButton', state, (elem: HTMLButtonElement, state) => {
    elem.disabled = state.fsm !== 'input' || !isEmail(state.email)
  })

  bindEffect('#loginMessage .email', state, (elem, state) => {
    elem.textContent = state.email
  })

  useEffect(state, state => {
    emailInput.disabled = state.fsm === 'working'
    loginForm.style.display = state.fsm === 'success' ? 'none' : null
    loginMessage.style.display = state.fsm === 'success' ? null : 'none'
  })

  emailInput.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') submitLogin(state)
  })

  loginMessage.addEventListener('click', e => {
    state.fsm = 'input'
  })

  onEvent('#loginButton', 'click', e => submitLogin(state))
}
