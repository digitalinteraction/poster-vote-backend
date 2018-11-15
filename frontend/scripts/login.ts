import { on, isEmail, bind, bind2, State } from './dom'
import axios from 'axios'

function resetMessage(elem: Element) {
  console.log('#resetMessage')
  elem.innerHTML = ''
}

function setMessage(elem: Element, email: string) {
  console.log('#setMessage')
  elem.innerHTML = `
  <div>We've sent an email to '${email}', check your email for a login link</div>`
}

let loginForm = document.getElementById('loginForm') as HTMLDivElement
let loginMessage = document.getElementById('loginMessage') as HTMLDivElement
let emailInput = document.getElementById('loginEmail') as HTMLInputElement
let loginButton = document.getElementById('loginButton') as HTMLButtonElement

if (loginForm && loginMessage && emailInput && loginButton) {
  loginButton.disabled = true

  emailInput.addEventListener('input', e => {
    loginButton.disabled = !isEmail(emailInput.value)
  })

  loginButton.addEventListener('click', async e => {
    resetMessage(loginMessage)
    let { data } = await axios.post('/api/users', { email: emailInput.value })
    setMessage(loginMessage, emailInput.value)
  })
}
