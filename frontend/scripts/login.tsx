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

async function submitLogin() {
  state.fsm = 'working'
  let { data } = await axios.post('/api/users', { email: emailInput.value })
  state.fsm = 'success'
}

if (loginForm && loginMessage && emailInput && loginButton) {
  useEffect(state, state => {
    loginButton.disabled = state.fsm !== 'input' || !isEmail(state.email)
  })

  useEffect(state, state => {
    loginMessage.innerHTML = ''
    loginMessage.appendChild(
      <div class="notification is-success">
        <button class="delete" />
        <div>
          We've sent an email to '{state.email}', check your email for a login
          link
        </div>
      </div>
    )
  })

  makeFsm(state, 'fsm', {
    input: {
      enter: () => {},
      leave: () => {}
    },
    working: {
      enter: () => {
        emailInput.disabled = true
      },
      leave: () => {
        emailInput.disabled = false
      }
    },
    success: {
      enter: () => {
        loginForm.style.display = 'none'
        loginMessage.style.display = null
      },
      leave: () => {
        loginForm.style.display = null
        loginMessage.style.display = 'none'
      }
    }
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
