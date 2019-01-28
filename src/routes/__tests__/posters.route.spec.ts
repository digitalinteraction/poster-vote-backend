import { TestHarness, seedPosters } from '../../core/TestHarness'
import * as posters from '../posters.route'
import { expect } from 'chai'
import { Table } from '../../const'

describe('Posters', () => {
  let harness = TestHarness.withMochaHooks()
  let userJwt = { usr: 'posters_user_1' }
  let posterId: number

  // Seed a poster with some options
  beforeEach(async () => {
    posterId = await seedPosters(harness.knex, userJwt.usr)
  })

  afterEach(async () => {
    await harness.clear()
  })

  describe('posters.index', () => {
    let route = harness.mockRoute('/', posters.index, userJwt)

    it('should return a http/200', async () => {
      let res = await route.get('/')
      expect(res.status).to.equal(200)
    })
    it('should return nothing when not authed', async () => {
      let unauthedRoute = harness.mockRoute('/', posters.index)
      let res = await unauthedRoute.get('/')
      expect(res.body.data).to.deep.equal([])
    })
    it('should return a users posters', async () => {
      let res = await route.get('/')
      expect(res.body.data).to.be.length(1)
    })
    it('should add the pdf_url', async () => {
      let res = await route.get('/')
      let poster = res.body.data[0]
      expect(poster.pdf_url).to.be.a('string')
    })
  })

  describe('posters.show', () => {
    let route = harness.mockRoute('/:id', posters.show)

    it('should return a http/200', async () => {
      let res = await route.get('/' + posterId)
      expect(res.status).to.equal(200)
    })
    it('should return the poster', async () => {
      let res = await route.get('/' + posterId)
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
      let res = await route.get('/' + posterId)
      let poster = res.body.data

      expect(poster.options).to.be.a('array')
      expect(poster.options).to.be.length(3)
    })
  })

  describe('posters.create', () => {
    let route = harness.mockRoute('/', posters.create, userJwt)

    it('should return a http/200', async () => {
      let res = await route.post('/').send({
        name: 'New Poster',
        question: 'What do you think?',
        options: ['A', 'B', 'C']
      })
      expect(res.status).to.equal(200)
    })
    it('should return the poster', async () => {
      let res = await route.post('/').send({
        name: 'New Poster',
        question: 'What do you think?',
        options: ['A', 'B', 'C']
      })
      let poster = res.body.data
      expect(poster.name).to.equal('New Poster')
      expect(poster.question).to.equal('What do you think?')
      expect(poster.options).to.be.length(3)
    })
    it('should store the poster', async () => {
      await harness.clear()
      await route.post('/').send({
        name: 'New Poster',
        question: 'What do you think?',
        owner: 'Owner',
        contact: 'Contact',
        colour: 'C0FFEE',
        options: ['A', 'B', 'C']
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
    let route = harness.mockRoute('/:id', posters.update, userJwt)

    it('should return a http/200', async () => {
      let res = await route.put('/' + posterId)
      expect(res.status).to.equal(200)
    })

    it('should update the poster', async () => {
      await route.put('/' + posterId).send({
        name: 'newName',
        question: 'newQuestion',
        owner: 'newOwner',
        contact: 'newContact',
        colour: '#f95162'
      })

      let [updated] = await harness.knex(Table.poster).where('id', posterId)

      expect(updated.name).to.equal('newName')
      expect(updated.question).to.equal('newQuestion')
      expect(updated.owner).to.equal('newOwner')
      expect(updated.contact).to.equal('newContact')
      expect(updated.colour).to.equal('f95162')
    })

    it('should update options', async () => {
      // ...
    })
  })

  describe('posters.destroy', () => {
    let route = harness.mockRoute('/:id', posters.destroy, userJwt)

    it('return a http/200', async () => {
      let res = await route.delete('/' + posterId)
      expect(res.status).to.equal(200)
    })
    it('mark the poster as inactive', async () => {
      await route.delete('/' + posterId)
      let [poster] = await harness.knex(Table.poster).select('*')
      expect(poster.active).to.equal(0)
    })
  })

  describe('posters.votes', () => {
    let route = harness.mockRoute('/:id', posters.votes)

    it('should return a http/200', async () => {
      let res = await route.get('/' + posterId)
      expect(res.status).to.equal(200)
    })
    it('should returns sum votes', async () => {
      let res = await route.get('/' + posterId)
      let votes = res.body.data.votes

      expect(res.body.data.lastUpdate).to.be.a('string')
      expect(votes[0].vote).to.equal(25)
      expect(votes[1].vote).to.equal(20)
      expect(votes[2].vote).to.equal(15)
    })
  })
})
