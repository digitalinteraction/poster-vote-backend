import { on, isEmail, bind } from './dom'

// on<MouseEvent>('#loginButton', 'click', (e, elem) => {
//   console.log('Ouch!')
// })

// on<KeyboardEvent, HTMLInputElement>('#loginEmail', 'input', (e, elem) => {
//   elem.disabled = !isEmail(elem.value)
// })

// let loginEmail: HTMLInputElement = document.getElementById('loginEmail') as any
// let loginButton: HTMLButtonElement
// loginEmail.disabled = !isEmail(lo)

type State = {
  email: string
}

type Computed = {
  canSubmit: boolean
}

const state: State = {
  email: ''
}

const computed = (state: State): Computed => ({
  canSubmit: isEmail(state.email)
})

type InputState = { disabled: boolean; value: string }
let [email, emailState] = bind<HTMLInputElement, InputState>(
  'loginEmail',
  { disabled: false, value: '' },
  (input, state) => {
    input.disabled = state.disabled
    input.value = state.value
  }
)

type ButtonState = { disabled: boolean }
let [button, buttonState] = bind<HTMLButtonElement, ButtonState>(
  'loginButton',
  { disabled: true },
  (button, state) => {
    button.disabled = state.disabled
  }
)

email.addEventListener('input', e => {
  emailState.value = (e.target as any).value
  buttonState.disabled = !isEmail(email.value)
})

button.addEventListener('click', e => {
  emailState.value = ''
  buttonState.disabled = true
})

// console.log(email, emailState)
// console.log(button, buttonState)
