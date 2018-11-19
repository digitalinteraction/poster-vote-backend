import './theme.sass'
import { onEvent } from './js/dom'
import { ApiClient } from './js/ApiClient'

let client = new ApiClient()

document.querySelectorAll('[js-cloak]').forEach(elem => {
  if (!(elem instanceof HTMLElement)) return
  elem.removeAttribute('js-cloak')
  elem.style.display = 'none'
})

onEvent('#logoutButton', 'click', e => {
  client.delete('/users').then(res => {
    window.location.href = '/'
  })
})
