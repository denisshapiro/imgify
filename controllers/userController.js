const validator = require('express-validator');
var async = require('async');
const bcrypt = require('bcryptjs');
var User = require('../models/user');
var Photo = require('../models/photo');



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
  
