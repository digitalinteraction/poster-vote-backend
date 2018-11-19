import './theme.sass'

document.querySelectorAll('[js-cloak]').forEach(elem => {
  if (!(elem instanceof HTMLElement)) return
  elem.removeAttribute('js-cloak')
  elem.style.display = 'none'
})
