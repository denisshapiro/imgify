const validator = require('express-validator');
var async = require('async');
var User = require('../models/user');
var Photo = require('../models/photo');

exports.index = function(req, res) {
    res.redirect('/photos');
}

exports.photo_list = function(req, res) {
    Photo.find({'visiblePublically': true})
    .exec(function (err, list_photos) {
      if (err) { return next(err); }
      res.render('photos', { title: 'All Photos', photos: list_photos, user: req.user });
    });
}

exports.photo_detail = function(req, res) {
    res.send('photo detail')
}

exports.photo_upload_get = function(req, res) {
    res.render('upload', { title: 'Upload Photo', user:req.user })
}

exports.photo_upload_post =  [
    validator.check('tags').trim(),
    //validator.check(req.files, 'must upload an image').isArray({min: 1}),

    validator.body('name').escape(),
    validator.body('tags').escape(),

  (req, res, next) => {
        console.log(req.body)
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            res.render('upload', { title: 'Upload Photo', user:req.user, errors:errors.array() });
            return;
        }
        if(!req.user){
            res.redirect('/log-in')
            return;
        }
        for(var i = 0; i < req.files.length; ++i){
            var file_url = req.files[i].location;
            var public = false;
            if(req.body.public == 'on') { public = true; }
            console.log("PUBLIC IS " + req.public)
            var photo = new Photo({ 
                user: req.user,
                image: file_url,
                visiblePublically: public,
                tags: [req.body.tags]
               });
                photo.save(function (err) {
                    if (err) { return next(err); }
                });
            } 
        res.redirect(req.user.url);
    }
];

exports.photo_delete_post = function(req, res) {
    res.send('photo detail')
}

exports.photo_update_post = function(req, res) {
    res.send('photo detail')
}

exports.photo_search_get = function(req, res) {
    res.send('photo detail')
}