import { isEmail, makeState, useEffect } from './dom'
import axios from 'axios'

let loginForm = document.getElementById('loginForm') as HTMLElement
let loginMessage = document.getElementById('loginMessage') as HTMLElement
let emailInput = document.getElementById('loginEmail') as HTMLInputElement
let loginButton = document.getElementById('loginButton') as HTMLButtonElement
let messageEmail = document.querySelector('#loginMessage .email') as HTMLElement

type LoginState = 'input' | 'working' | 'success'

if (loginForm && loginMessage && emailInput && loginButton) {
  let state = makeState({
    email: '',
    fsm: 'input' as LoginState
  })

  async function submitLogin() {
    state.fsm = 'working'
    let { data } = await axios.post('/api/users', { email: emailInput.value })
    state.fsm = 'success'
  }

  useEffect(state, state => {
    loginButton.disabled = state.fsm !== 'input' || !isEmail(state.email)
  })

  useEffect(state, state => {
    messageEmail.textContent = state.email
  })

  useEffect(state, state => {
    emailInput.disabled = state.fsm === 'working'
    loginForm.style.display = state.fsm === 'success' ? 'none' : null
    loginMessage.style.display = state.fsm === 'success' ? null : 'none'
  })

  emailInput.addEventListener('input', e => {
    state.email = (e.target as HTMLInputElement).value
  })

  emailInput.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === 'Enter') submitLogin()
  })

  loginMessage.addEventListener('click', e => {
    state.fsm = 'input'
  })

  loginButton.addEventListener('click', async e => submitLogin())
}
