import { TestHarness, TestAgent, seedPosters } from '../../core/TestHarness'
// import * as posters from '../posters.route'
import { expect } from 'chai'
import { Table } from '../../const'

describe('Posters', () => {
  let harness = TestHarness.withMochaHooks()
  let agent = harness.chow.agent

  let mockJwt = { sub: 'posters_user_1', typ: 'auth' }
  let authn = { token: harness.signJwt(mockJwt) }
  let posterId: number
  let posterUri = ''

  // Seed a poster with some options
  beforeEach(async () => {
    posterId = await seedPosters(harness.knex, mockJwt.sub)
    posterUri = `/posters/${posterId}`
  })

  afterEach(async () => {
    await harness.clear()
  })

  describe('posters.index', () => {
    it('should return a http/200', async () => {
      let res = await agent.get('/posters').query(authn)
      expect(res.status).to.equal(200)
    })
    it('should return nothing when not authed', async () => {
      let res = await agent.get('/posters')
      expect(res.body.data).to.deep.equal([])
    })
    it('should return a users posters', async () => {
      let res = await agent.get('/posters').query(authn)
      expect(res.body.data).to.be.length(1)
    })
    it('should add the pdf_url', async () => {
      let res = await agent.get('/posters').query(authn)
      let [poster] = res.body.data
      expect(poster.pdf_url).to.be.a('string')
    })
  })

  describe('posters.show', () => {
    it('should return a http/200', async () => {
      let res = await agent.get(posterUri).query(authn)
      expect(res.status).to.equal(200)
    })
    it('should return the poster', async () => {
      let res = await agent.get(posterUri).query(authn)
      let poster = res.body.data

      expect(poster.name).to.be.a('string')
      expect(poster.question).to.be.a('string')
      expect(poster.code).to.be.a('number')
      expect(poster.creator_hash).to.be.a('string')
      expect(poster.colour).to.be.a('string')
      expect(poster.owner).to.be.a('string')
      expect(poster.contact).to.be.a('string')
    })
    it('should embed options', async () => {
      let res = await agent.get(posterUri).query(authn)
      let poster = res.body.data

      expect(poster.options).to.be.a('array')
      expect(poster.options).to.be.length(3)
    })
  })

  describe('posters.create', () => {
    let url = '/posters'

    it('should return a http/200', async () => {
      let res = await agent
        .post(url)
        .query(authn)
        .send({
          name: 'New Poster',
          question: 'What do you think?',
          options: ['A', 'B', 'C'],
        })
      expect(res.status).to.equal(200)
    })
    it('should return the poster', async () => {
      let res = await agent
        .post(url)
        .query(authn)
        .send({
          name: 'New Poster',
          question: 'What do you think?',
          options: ['A', 'B', 'C'],
        })
      let poster = res.body.data
      expect(poster.name).to.equal('New Poster')
      expect(poster.question).to.equal('What do you think?')
      expect(poster.options).to.be.length(3)
    })
    it('should store the poster', async () => {
      await harness.clear()
      await agent
        .post(url)
        .query(authn)
        .send({
          name: 'New Poster',
          question: 'What do you think?',
          owner: 'Owner',
          contact: 'Contact',
          colour: 'C0FFEE',
          options: ['A', 'B', 'C'],
        })
      let [poster = {}] = await harness.knex(Table.poster).select('*')
      let options = await harness.knex(Table.posterOption).select('*')

      expect(poster.name).to.equal('New Poster')
      expect(poster.question).to.equal('What do you think?')
      expect(poster.owner).to.equal('Owner')
      expect(poster.contact).to.equal('Contact')
      expect(poster.colour).to.equal('C0FFEE')
      expect(options).to.be.length(3)

      expect(options[0].text).to.equal('A')
      expect(options[0].poster_id).to.equal(poster.id)

      expect(options[1].text).to.equal('B')
      expect(options[1].poster_id).to.equal(poster.id)

      expect(options[2].text).to.equal('C')
      expect(options[2].poster_id).to.equal(poster.id)
    })
  })

  describe('posters.update', () => {
    it('should return a http/200', async () => {
      let res = await agent.put(posterUri).query(authn)
      expect(res.status).to.equal(200)
    })

    it('should update the poster', async () => {
      await agent.put(posterUri).query(authn).send({
        name: 'newName',
        question: 'newQuestion',
        owner: 'newOwner',
        contact: 'newContact',
        colour: '#f95162',
      })

      let [updated] = await harness.knex(Table.poster).where('id', posterId)

      expect(updated.name).to.equal('newName')
      expect(updated.question).to.equal('newQuestion')
      expect(updated.owner).to.equal('newOwner')
      expect(updated.contact).to.equal('newContact')
      expect(updated.colour).to.equal('f95162')
    })

    it('should update options', async () => {
      await agent
        .put(posterUri)
        .query(authn)
        .send({
          options: [
            { value: 1, text: 'Updated Option A' },
            { value: 2, text: 'Updated Option B' },
            { value: 3, text: 'Updated Option C' },
          ],
        })

      let [a, b, c] = await harness
        .knex(Table.posterOption)
        .where('poster_id', posterId)
        .orderBy('value')

      expect(a.text).to.equal('Updated Option A')
      expect(b.text).to.equal('Updated Option B')
      expect(c.text).to.equal('Updated Option C')
    })

    it('should create new options', async () => {
      await agent
        .put(posterUri)
        .query(authn)
        .send({
          options: [{ value: 4, text: 'Option D' }],
        })

      let [d] = await harness
        .knex(Table.posterOption)
        .where('poster_id', posterId)
        .where('value', 4)

      expect(d).to.exist
      expect(d.text).to.equal('Option D')
    })
  })

  describe('posters.destroy', () => {
    it('return a http/200', async () => {
      let res = await agent.delete(posterUri).query(authn)
      expect(res.status).to.equal(200)
    })
    it('mark the poster as inactive', async () => {
      await agent.delete(posterUri).query(authn)
      let [poster] = await harness.knex(Table.poster).select('*')
      expect(poster.active).to.equal(0)
    })
  })

  describe('posters.votes', () => {
    let votesUrl = ''

    beforeEach(() => {
      votesUrl = `${posterUri}/votes`
    })

    it('should return a http/200', async () => {
      let res = await agent.get(votesUrl).query(authn)
      expect(res.status).to.equal(200)
    })
    it('should returns sum votes', async () => {
      let res = await agent.get(votesUrl).query(authn)
      let votes = res.body.data.votes

      expect(res.body.data.lastUpdate).to.be.a('string')
      expect(votes[0].vote).to.equal(25)
      expect(votes[1].vote).to.equal(20)
      expect(votes[2].vote).to.equal(15)
    })
  })
})
