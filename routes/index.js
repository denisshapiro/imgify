var express = require('express');
var router = express.Router();
const passport = require('passport');
var multer  = require('multer')
var aws = require('aws-sdk')
const multerS3 = require('multer-s3');

var photoController = require('../controllers/photoController');
var userController = require('../controllers/userController');

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
          console.log(file);
          cb(null, file.originalname);
      }
  })
});


router.get('/', photoController.index);
router.get('/photos', photoController.photo_list);

router.get('/sign-up', userController.user_signup_get);
router.post('/sign-up', userController.user_signup_post);
router.get('/log-in', userController.user_login_get);
router.post('/log-in', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/log-in'}));

router.get("/log-out", userController.user_logout);

module.exports = router;
