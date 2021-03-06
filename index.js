var express = require('express');
var router = express.Router();
const passport = require('passport');
var multer  = require('multer')
var aws = require('aws-sdk')
const multerS3 = require('multer-s3');

var photoController = require('./controllers/photoController');
var userController = require('./controllers/userController');

aws.config.update({
  accessKeyId:  process.env.S3_KEY,
  secretAccessKey: process.env.S3_SECRET,
  region: 'us-east-2'
});

const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
      s3: s3,
      acl: 'public-read',
      bucket: 'imgifydenis',
      key: function (req, file, cb) {
          cb(null, Date.now() + file.originalname);
      }
  })
});

router.get('/', photoController.index)
router.get('/photos', photoController.photo_list_html)
router.get('/photos.json', photoController.photo_list_json)
router.get('/upload', photoController.photo_upload_get)
router.get('/photo/:id', photoController.photo_detail_html)
router.get('/photo.json/:id', photoController.photo_detail_json)
router.post('/photo/:id', photoController.photo_update)
router.post('/photo/:id/delete', photoController.photo_delete)
router.post('/upload', upload.array('uploaded_images', 30), photoController.photo_upload_post)

router.get('/sign-up', userController.user_signup_get)
router.post('/sign-up', userController.user_signup_post_html)
router.post('/sign-up.json', userController.user_signup_post_json)
router.get('/log-in', userController.user_login_get)
router.post('/log-in', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/log-in', failureFlash: true}))
router.get('/user/:id', userController.user_detail_html)
router.get('/user.json/:id', userController.user_detail_json)

router.get("/log-out", userController.user_logout)

module.exports = router;
