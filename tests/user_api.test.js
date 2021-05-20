const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const User = require('../models/user')
const helper = require('./test_helper')

beforeEach(async () => {
    await User.deleteMany({})
    const userObjects = helper.initialUsers.map(user => new User(user))
	const userPromises = userObjects.map(user => user.save())
	await Promise.all(userPromises)
})

describe('when there is initially one user in db', () => {
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await helper.usersInDb()
  
      const newUser = {
        username: "testUser1",
        password: "password123",
        confirmPassword : "password123"
      }
  
      await api
        .post('/sign-up.json')
        .send(newUser)
        .expect(200)
        .expect('Content-Type', /application\/json/)
  
      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)
  
      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })
  
    test('creation fails with non matching password confirmation', async () => {
      const usersAtStart = await helper.usersInDb()
  
      const newUser = {
        'username': "rootUser",
        'password': "newPassword",
        'confirmPassword' : "newPassword1"
      }
  
      const result = await api
        .post('/sign-up.json')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)
      
      const messages = result.body.map(u => u.msg)
      expect(messages).toContain('Confirmation does not match')
  
      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
})
  
afterAll(() => {
    mongoose.connection.close()
})