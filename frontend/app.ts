import './theme.sass'

import './scripts/login.tsx'

document.querySelectorAll('[js-cloak]').forEach(elem => {
  if (!(elem instanceof HTMLElement)) return
  elem.removeAttribute('js-cloak')
  elem.style.display = 'none'
})
