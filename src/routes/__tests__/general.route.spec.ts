import { TestHarness, TestAgent } from '../../core/TestHarness'
import { expect } from 'chai'

describe('General', () => {
  let harness = TestHarness.withMochaHooks()

  describe('general.hello', () => {
    let agent: TestAgent
    before(async () => {
      agent = harness.chow.agent
    })
    it('should return a http 200', async () => {
      let res = await agent.get('/')
      expect(res.status).to.equal(200)
    })
  })
})
