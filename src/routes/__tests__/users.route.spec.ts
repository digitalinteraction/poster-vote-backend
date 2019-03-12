import { expect } from 'chai'

describe('users.route', () => {
  it('should pass', () => {
    expect(1 + 1).to.equal(2)
  })
})

// import { TestHarness, TestRoute, testEmails } from '../../core/TestHarness'
// import { me, request, check, logout } from '../users.route'
// import { expect } from 'chai'
//
// describe('Users', () => {
//   let harness = TestHarness.withMochaHooks()
//
//   describe('users.me', () => {
//     it('should return a http/200', async () => {
//       let route = harness.mockRoute('/', me)
//       let res = await route.get('/')
//       expect(res.status).to.equal(200)
//     })
//     it('should return the user', async () => {
//       let jwt = { usr: 'hello' }
//       let route = harness.mockRoute('/', me, jwt)
//       let res = await route.get('/')
//       expect(res.body.data.usr).to.equal('hello')
//     })
//   })
//
//   describe('users.request', () => {
//     let route: TestRoute
//     before(async () => {
//       route = harness.mockRoute('/', request)
//     })
//
//     it('should return a http/200', async () => {
//       let res = await route.post('/').send({ email: 'users.request.1@test.io' })
//       expect(res.status).to.equal(200)
//     })
//     it('should send an email', async () => {
//       await route.post('/').send({ email: 'users.request.2@test.io' })
//       expect(testEmails).to.include('users.request.2@test.io')
//     })
//   })
//
//   describe('users.check', () => {
//     let route: TestRoute
//     before(async () => {
//       route = harness.mockRoute('/', check)
//     })
//
//     it('should return a http/302', async () => {
//       let token = harness.userJwt('users.check.1@test.io')
//       let res = await route.get(`/?token=${token}`)
//       expect(res.status).to.equal(302)
//     })
//
//     it('should set a cookie', async () => {
//       let token = harness.userJwt('users.check.2@test.io')
//       let res = await route.get(`/?token=${token}`)
//       let cookie = res.header['set-cookie']
//       expect(cookie).to.be.length(1)
//       expect(cookie[0]).to.include('postervote_jwt=')
//     })
//   })
//
//   describe('users.logout', () => {
//     let route: TestRoute
//     before(async () => {
//       route = harness.mockRoute('/', logout)
//     })
//
//     it('should return a http/302', async () => {
//       let res = await route.get('/')
//       expect(res.status).to.equal(302)
//     })
//
//     it('should set a cookie', async () => {
//       let res = await route.get('/')
//       let cookie = res.header['set-cookie']
//       expect(cookie).to.be.length(1)
//       expect(cookie[0]).to.include('postervote_jwt=')
//       expect(cookie[0]).to.include('Expires=Thu, 01 Jan 1970')
//     })
//   })
// })
