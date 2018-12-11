import { TestHarness, TestRoute } from '../../core/TestHarness'
import { hello } from '../general.route'
import { expect } from 'chai'

describe('General', () => {
  let harness = TestHarness.withMochaHooks()

  describe('general.hello', () => {
    let route: TestRoute
    before(async () => {
      route = harness.mockRoute('/', hello)
    })
    it('should return a http 200', async () => {
      let res = await route.get('/')
      expect(res.status).to.equal(200)
    })
  })
})
