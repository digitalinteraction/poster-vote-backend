const xmlRoot = (name: string, attrs: object = {}, children: string[] = []) =>
  '<?xml version="1.0" encoding="UTF-8"?>' + xml(name, attrs, children)

const xml = (name: string, attrs: object = {}, children: string[] = []) => {
  let parts = [`<${name}`]
  Object.entries(attrs).forEach(([key, val]) => parts.push(` ${key}="${val}"`))
  parts.push('>')
  parts.push(...children)
  parts.push(`</${name}>`)
  return parts.join('')
}
