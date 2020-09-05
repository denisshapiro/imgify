var express = require('express');
var router = express.Router();
const passport = require('passport');

var photoController = require('../controllers/photoController');
var userController = require('../controllers/userController');


router.get('/sign-up', userController.user_signup_get);
router.post('/sign-up', userController.user_signup_post);
router.get('/log-in', userController.user_login_get);
router.post('/log-in', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/log-in', failureFlash: true,}));
router.get('/user/:id', userController.user_detail);

router.get("/log-out", userController.user_logout);

module.exports = router;
