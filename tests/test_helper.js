const Photo = require('../models/photo')
const user = require('../models/user')
const User = require('../models/user')

const initialUsers = [
    {
        'username': "rootUser",
        'password': "testPw1",
        'confirmPassword': "testPw1"
    },
    {
        'username': "tester2",
        'password': "testPw2",
        'confirmPassword': "testPw2"
    }
]

const initialPhotos = [
    {
        visiblePublically: true,
        tags: ["puffin","seabird"],
        image: "test1.jpg",
    },
    {
        timestamp: "2020-09-06T09:39:27.360Z",
        visiblePublically: true,
        tags: ["wildlife", "elk", "antler"],
        image: "test2.jpg",
    },
    {
        timestamp: "2020-09-06T09:44:25.773Z",
        visiblePublically: true,
        tags: ["flower"],
        image: "test3.jpg",
    }
]

const nonExistingId = async (user) => {
    const photo = new Photo(
        {
            timestamp: "2020-09-06T09:44:25.773Z",
            user: user,
            visiblePublically: true,
            tags: ["test"],
            image: "test4.jpg",
        }
    )
    await photo.save()
    await photo.remove()
  
    return photo.id.toString()
  }
  

const photosInDb = async () => {
    const photos = await Photo.find({})
    return photos.map(photo => photo.toJSON())
  }
  
const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = {
    initialPhotos, initialUsers, photosInDb, usersInDb, nonExistingId
}