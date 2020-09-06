const validator = require('express-validator');
var async = require('async');
const bcrypt = require('bcryptjs');
var User = require('../models/user');
var Photo = require('../models/photo');

exports.user_detail = function(req, res, next){
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      var err = new Error('Invalid User ID');
      err.status = 404;
      return next(err);
    }
    async.parallel({
        public_photos: function(callback) {
            Photo.find({'user': req.params.id, 'visiblePublically': true})
              .exec(callback);
        },
        user: function(callback) { 
            User.findById(req.params.id).exec(callback);
        },

        private_photos: function(callback) {
            Photo.find({'user': req.params.id, 'visiblePublically': false}).exec(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.user==null) {
            var err = new Error('User not found');
            err.status = 404;
            return next(err);
        }
        if(!req.user || req.user.id !== req.params.id){
            res.render('user', { title: results.user.username + '\'s photos', public_photos: results.public_photos, user: req.user });
        }
        else if(req.user.id === req.params.id) {
            uploaded = req.session.uploaded;
            req.session.uploaded = null;
            res.render('user', { title: 'your photos', public_photos: results.public_photos, private_photos: results.private_photos, user:req.user, just_uploaded: uploaded });
        }   
    });
}

exports.user_signup_get = function (req, res) {
    res.render('signup', {title: "sign up", user: req.user})
};

exports.user_signup_post = [
    validator.body('username', 'Username must not be empty').trim().isLength({ min: 1 })
      .custom(value => {
        return User.findOne({ username : value }).then(user => {
          if (user) { return Promise.reject('Username already taken')
          }
        })
      }),
    validator.body('password', 'Password must contain at least 7 characters').trim().isLength({ min: 7 }),
    validator.body('confirmPassword').custom((value, { req }) => {
      if (value != req.body.password) {
        throw new Error('Confirmation does not match');
      }
      return true;
    }),

    validator.body('*').escape(),
  
    (req, res, next) => {
      const errors = validator.validationResult(req);

        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
            if (err) { return next(err); }
            const user = new User({
            username: req.body.username,
            password: hashedPassword,
            });
            if (!errors.isEmpty()) {
                res.render('signup', { title: 'sign up', user: req.user, errors: errors.array() });
            } else {
                user.save((err) => {
                    if (err) { return next(err); }
                    res.redirect('/log-in');
            });
        }
      });
    },
  ];
  
exports.user_login_get = function (req, res) {
    res.render('login', {user: req.user});
};

exports.user_logout = function(req, res) {
    req.logout();
    res.redirect("/");
};
  
