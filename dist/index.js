'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
// import * as Sequelize from 'sequelize'
const sql_1 = require('./sql')
const sqlUri = 'mysql://root:secret@127.0.0.1:3306/postervote'
;(async () => {
  try {
    // let sequelize = new Sequelize('mysql://root:secret@127.0.0.1/postervote')
    //
    // const Poster = sequelize.define('user', {
    //   question: { type: Sequelize.STRING },
    //   colour: { type: Sequelize.STRING }
    // })
    //
    // await Promise.all([
    //   Poster.sync()
    // ])
    let { sql, pool, close } = sql_1.makeSqlClient(sqlUri)
    let r = await sql`select * from posters`
    console.log(r)
    await close()
  } catch (err) {
    console.log('Something went wrong', err.message)
    console.log(err)
  }
})()
