import * as mysql from 'mysql'

export interface SqlFn {
  (segments: TemplateStringsArray, ...values: any[]): Promise<any>
}

export function makeSqlClient(uri: string) {
  let pool = mysql.createPool(uri)

  let sql = function(
    segments: TemplateStringsArray,
    ...values: any[]
  ): Promise<any> {
    let index = 0
    let queryString = ''

    // Loop through the string and values together, generating an escaped SQL query
    while (index < segments.length) {
      queryString += segments[index]
      if (values[index]) queryString += mysql.escape(values[index])
      index++
    }

    return new Promise((resolve, reject) => {
      pool.query(queryString, (err, values) => {
        if (err) reject(err)
        else resolve(values)
      })
    })
  }

  let close = () =>
    new Promise((resolve, reject) => {
      pool.end(err => {
        if (err) reject(err)
        else resolve()
      })
    })

  return { pool, sql, close }
}
