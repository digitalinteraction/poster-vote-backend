import { h, isEmail, makeState, useEffect, computeProps, makeFsm } from './dom'
import axios from 'axios'

declare global {
  namespace JSX {
    interface Element extends HTMLElement {}
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

let loginForm = document.getElementById('loginForm') as HTMLDivElement
let loginMessage = document.getElementById('loginMessage') as HTMLDivElement
let emailInput = document.getElementById('loginEmail') as HTMLInputElement
let loginButton = document.getElementById('loginButton') as HTMLButtonElement

type LoginState = 'input' | 'working' | 'success'

let state = makeState({
  email: '',
  fsm: 'input' as LoginState
})

let computed = computeProps(state, {
  canSubmit: state => isEmail(state.email)
})

async function submitLogin() {
  state.fsm = 'working'
  let { data } = await axios.post('/api/users', { email: emailInput.value })
  state.fsm = 'success'
}

if (loginForm && loginMessage && emailInput && loginButton) {
  useEffect(computed, state => {
    loginButton.disabled = !state.canSubmit
  })

  makeFsm(state, 'fsm', {
    input: {
      enter: () => {},
      leave: () => {}
    },
    working: {
      enter: () => {
        emailInput.disabled = true
        loginButton.disabled = true
      },
      leave: () => {
        emailInput.disabled = false
        loginButton.disabled = false
      }
    },
    success: {
      enter: () => {
        loginForm.style.display = 'none'
        loginMessage.style.display = null
        loginMessage.innerHTML = `
        <div class="notification is-success">
          <button class="delete"></button>
          <div>We've sent an email to '${
            state.email
          }', check your email for a login link</div>
        </div>`
      },
      leave: () => {
        loginForm.style.display = null
        loginMessage.style.display = 'none'
      }
    }
  })

  let html = <h1>Hey</h1>

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
