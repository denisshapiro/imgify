var express = require('express');
var router = express.Router();
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

//router.get('/sign-up', userController.userSignupGet);
//router.post('/sign-up', userController.userSignupPost);
//router.get('/log-in', userController.userLoginGet);
/*
router.post('/log-in', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/log-in',
}));
*/
module.exports = router;
