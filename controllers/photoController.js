const validator = require('express-validator');
var async = require('async');
var User = require('../models/user');
var Photo = require('../models/photo');
const { populate } = require('../models/user');
const photo = require('../models/photo');

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

exports.photo_detail = function(req, res, next) {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        var err = new Error('Invalid Photo ID');
        err.status = 404;
        return next(err);
      }

    Photo.findById(req.params.id).populate('user').exec(function(err, photo){
    if (err) { return next(err); }
    if (photo==null) {
            var err = new Error('Photo not found');
            err.status = 404;
            return next(err);
        }
    User.findById(photo.user.id)
    .exec(function(err, user){
        if (err) { return next(err); }
        if(req.user){
            if(req.user.id === photo.user.id){
                res.render('photo_detail', { title: 'Photo', photo:photo, photo_user: user, user:req.user, edit: true });
            }
            else if(req.user.id !== photo.user.id && photo.visiblePublically){
                res.render('photo_detail', { title: 'Photo', photo:photo, photo_user: user, user:req.user, edit: false });
            }
            else if(req.user.id !== photo.user.id && !photo.visiblePublically){
                var err = new Error("You can't access this photo");
                err.status = 404;
                return next(err);
            }
        }
        else{
            if(photo.visiblePublically){
                res.render('photo_detail', { title: 'Photo', photo:photo, photo_user:user, user:req.user, edit:false });
            }
            else{
                var err = new Error("You can't access this photo");
                err.status = 404;
                return next(err);
            }
        }
    });  
    });
}

exports.photo_upload_get = function(req, res) {
    res.render('upload', { title: 'Upload Photo', user:req.user })
}

exports.photo_upload_post =  [
    validator.check('tags').trim(),
    //validator.check(req.files, 'must upload an image').isArray({min: 1}),

    validator.body('tags').escape(),

  (req, res, next) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            res.render('upload', { title: 'Upload Photo', user:req.user, errors:errors.array() });
            return;
        }
        if(!req.user){
            res.redirect('/log-in')
            return;
        }

        var tags = [];
        var tag_string = req.body.tags;
        if (tag_string.replace(/\s/g, '').length) {
            tags = req.body.tags.split(",");
            for (var i = 0; i < tags.length; i++) tags[i] = tags[i].trim().toLowerCase();
        }

        for(var i = 0; i < req.files.length; ++i){
            var file_url = req.files[i].location;
            var public = false;
            if(req.body.public == 'on') { public = true; }
            var photo = new Photo({ 
                user: req.user,
                image: file_url,
                visiblePublically: public,
                tags: tags
               });
                photo.save(function (err) {
                    if (err) { return next(err); }
                });
            } 
        res.redirect(req.user.url);
    }
];

exports.photo_delete = function(req, res, next) {
    Photo.findById(req.params.id).exec(function(err, photo){
        if (err) { return next(err); }
        Photo.findByIdAndDelete(photo._id, function(err) {
            if (err) { return next(err); }
            res.redirect(req.user.url)
        });
    });
}

exports.photo_update = function(req, res, next) {
    if(!req.user){
        res.redirect('/log-in')
        return;
    }

    if(!(req.body.tag_update instanceof Array)){
        if(typeof req.body.tag_update === 'undefined') req.body.tag_update=[];
        else  req.body.tag_update = new Array(req.body.tag_update);
    }

    var public = false;
    if(req.body.public == 'on') { public = true; }

    var tags = [];
    var tag_string = req.body.tags;
    if (tag_string.replace(/\s/g, '').length) {
        tags = req.body.tags.split(",");
        for (var i = 0; i < tags.length; i++) tags[i] = tags[i].trim().toLowerCase();
    }
    
    Photo.findById(req.params.id).exec(function(err, photo){
        if (err) { return next(err); }

        for(var i = 0; i < photo.tags.length; ++i ){
            if(!req.body.tag_update.includes(photo.tags[i])){
                tags.push(photo.tags[i]);
            }
        }

        var newPhoto = new Photo({ 
            timestamp: photo.timestamp,
            user: photo.user,
            visiblePublically: public,
            image: photo.image,
            tags: tags,
            _id: req.params.id
            });

        Photo.findByIdAndUpdate(req.params.id, newPhoto, function (err, thePhoto) {
            if (err) { return next(err); }
            res.redirect(thePhoto.url);
        });
    });
}

exports.photo_search_get = function(req, res) {
    res.send('photo detail')
}