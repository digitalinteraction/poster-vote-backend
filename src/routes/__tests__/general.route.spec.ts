import { TestHarness, TestRoute } from '../../core/TestHarness'
import { hello } from '../general.route'
import { expect } from 'chai'

let harness: TestHarness
let route: TestRoute

before(async () => {
  harness = await TestHarness.create()
  route = harness.mockRoute('/', hello)
  await harness.setup()
})

beforeEach(async () => {
  await harness.clear()
})

after(async () => {
  await harness.teardown()
})

describe('general.route', () => {
  describe('GET /', () => {
    it('should return a http 200', async () => {
      let res = await route.get('/')
      expect(res.status).to.equal(200)
    })
  })
})
