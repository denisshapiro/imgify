//const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const supertest = require('supertest')
const superagent = require('superagent')
const path  = require('path')
const app = require('../app')
const api = supertest(app)
const Photo = require('../models/photo')
const User = require('../models/user')
const helper = require('./test_helper')

let userId
let userObj //for mimicking populating user

beforeAll(async () => {
  await User.deleteMany({})
	const user = {
		"username" : "tester",
		"password" : "testing",
    "confirmPassword" : "testing"
	}

	const newUser = await api
		.post("/sign-up.json")
		.send(user)
		.set("Accept","application/json")
		.expect('Content-Type', /application\/json/)
  userId = newUser.body.id
  userObj = newUser.body
})

beforeEach(async () => {
  await Photo.deleteMany({})

  helper.initialPhotos.forEach(function (photo) {
    photo.user = userId;
  })

  const photoObjects = helper.initialPhotos
    .map(photo => new Photo(photo))
  const promiseArrayPhotos = photoObjects.map(photo => photo.save())
  await Promise.all(promiseArrayPhotos)
})

describe('when there is initially some photos', () => {
  test('photos are returned as json', async () => {
    await api
      .get('/photos.json')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all photos are returned', async () => {
    const response = await api.get('/photos.json')
    expect(response.body.list_photos).toHaveLength(helper.initialPhotos.length)
  })

  test('the first photo has correct url', async () => {
    const response = await api.get('/photos.json')

    const urls = response.body.list_photos.map(r => r.image)
    expect(urls).toContain(helper.initialPhotos[0].image)
  })
})

describe('viewing a specific photo', () => {
  test('a specific photo can be viewed when permitted', async () => {
    const photosAtStart = await helper.photosInDb()
  
    const photoToView = photosAtStart[0]
    photoToView.user = userObj
  
    const resultPhoto = await api
      .get(`/photo.json/${photoToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    const processedPhotoToView = JSON.parse(JSON.stringify(photoToView))
    expect(resultPhoto.body.photo).toEqual(processedPhotoToView)
  })

  test('fails with statuscode 404 if photo does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId(userId)

    await api
      .get(`/photo.json/${validNonexistingId}`)
      .expect(404)
  })

  test('fails with statuscode 400 if ID is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/photo.json/${invalidId}`)
      .expect(400)
  })
})

describe('when authentication is present', () => {
  test('a photo can be deleted', async () => {
    const loginUser = {
      "username" : userObj.username,
      "password": "testing"
    }
   
    let res = await api
      .post("/log-in")
      .send(loginUser)

    const photosAtStart = await helper.photosInDb()
    const photoToDelete = photosAtStart[0]

    await api
      .post(`/photo/${photoToDelete.id}/delete`)
      .set('cookie', res.headers['set-cookie'])
      .expect(302)
    
    const photosAtEnd = await helper.photosInDb()

    expect(photosAtEnd).toHaveLength(
      helper.initialPhotos.length - 1
    )

    const urls = photosAtEnd.map(r => r.image)
  
    expect(urls).not.toContain(photoToDelete.url)
  })

  test('a photo can be uploaded', async () => {
    
    const loginUser = {
      "username" : userObj.username,
      "password": "testing"
    }
   
    let res = await api
      .post("/log-in")
      .send(loginUser)

   await api
      .post('/upload')
      .attach('uploaded_images', path.resolve(__dirname, 'test6.jpg'))
      .set('cookie', res.headers['set-cookie'])
      .expect(302)

    const photosAtEnd = await helper.photosInDb()      
    expect(photosAtEnd).toHaveLength(helper.initialPhotos.length + 1)
  })
})

describe('when authentication is not present', () => {
  test('a photo cannot be deleted', async () => {
    const photosAtStart = await helper.photosInDb()
    const photoToDelete = photosAtStart[0]

    await api
      .post(`/photo/${photoToDelete.id}/delete`)
      .expect(500)
    
    const photosAtEnd = await helper.photosInDb()

    expect(photosAtEnd).toHaveLength(helper.initialPhotos.length)

    const urls = photosAtEnd.map(r => r.image)
    expect(urls).toContain(photoToDelete.image)
  })

  test('a photo cannot be uploaded', async () => {
   await api
      .post('/upload')
      .attach('uploaded_images', path.resolve(__dirname, 'test6.jpg'))

    const photosAtEnd = await helper.photosInDb()      
    expect(photosAtEnd).toHaveLength(helper.initialPhotos.length)
  })

  test('another users private photo cannot be viewed', async () => {
    const user2 = {
      "username" : "user2",
      "password" : "testing",
      "confirmPassword" : "testing"
    }
  
    await api
      .post("/sign-up.json")
      .send(user2)
      .set("Accept","application/json")
      .expect('Content-Type', /application\/json/)

    let loginUser = {
      "username" : "user2",
      "password": "testing"
    }
    
    let res = await api
      .post("/log-in")
      .send(loginUser)

    await api
      .post('/upload')
      .attach('uploaded_images', path.resolve(__dirname, 'test6.jpg'))
      .set('cookie', res.headers['set-cookie'])
    
    res = await api
      .post("/log-out")

    const photos = await helper.photosInDb()
    const photoToView = photos[3] //not visible publicly

    loginUser = {
      "username" : userObj.username,
      "password": "testing"
    }
    
    res = await api
      .post("/log-in")
      .send(loginUser)

    await api
      .get(`/photo.json/${photoToView.id}`)
      .expect(404)
   })
})

afterAll(() => {
  mongoose.connection.close()
})