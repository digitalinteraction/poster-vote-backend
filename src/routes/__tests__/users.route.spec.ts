import { TestHarness } from '../../core/TestHarness'
import { expect } from 'chai'

describe('Users', () => {
  let harness = TestHarness.withMochaHooks()
  let agent = harness.chow.agent

  let mockJwt = { sub: 'posters_user_1', typ: 'auth' }
  let authn = { token: harness.signJwt(mockJwt) }

  describe('users.me', () => {
    it('should return a http/200', async () => {
      let res = await agent.get('/users').query(authn)
      expect(res.status).to.equal(200)
    })
    it('should return the user', async () => {
      let res = await agent.get('/users').query(authn)
      expect(res.body.data.usr).to.equal('posters_user_1')
    })
  })

  describe('users.logout', () => {
    it('should return a http/302', async () => {
      let res = await agent.delete('/users').query(authn)
      expect(res.status).to.equal(302)
    })

    it('should set a cookie', async () => {
      let res = await agent.delete('/users').query(authn)
      let cookie = res.header['set-cookie']
      expect(cookie).to.be.length(1)
      expect(cookie[0]).to.include('postervote_jwt=')
      expect(cookie[0]).to.include('Expires=Thu, 01 Jan 1970')
    })
  })
})
