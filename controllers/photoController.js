const validator = require('express-validator');
var async = require('async');
var User = require('../models/user');
var Photo = require('../models/photo');
const vision = require('@google-cloud/vision');

exports.index = function(req, res) {
    res.redirect('/photos');
}

function findCommonElement(arr1, arr2) { 
    return arr1.some(item => arr2.includes(item)) 
} 

function photo_list(req, res, format){
    if(req.query.search){
        var tags = [];
        var tag_string = req.query.search;
        if (tag_string.replace(/\s/g, '').length) {
            tags = req.query.search.split(",");
            for (var i = 0; i < tags.length; i++) tags[i] = tags[i].trim().toLowerCase();
        }

        if(req.user){
            async.parallel({
                public_photos: function(callback) {
                    Photo.find({'visiblePublically': true})
                      .exec(callback)
                },
                private_photos: function(callback) {
                    Photo.find({'user': req.user.id, 'visiblePublically': false}).exec(callback);
                },
            }, function(err, results) {
                if (err) { return next(err) }
                var publicPhotos = []
                var privatePhotos = []
                for(var i = 0; i < results.public_photos.length; ++i){
                    if(findCommonElement(results.public_photos[i].tags, tags)){
                        publicPhotos.push(results.public_photos[i]);
                    }
                }
                for(var i = 0; i < results.private_photos.length; ++i){
                    if(findCommonElement(results.private_photos[i].tags, tags)){
                        privatePhotos.push(results.private_photos[i])
                    }
                }
                if(format === 'html'){
                    res.render('search_results', {title: 'Search', public_photos: publicPhotos, private_photos: privatePhotos, user: req.user, tags: tags });
                }
                else if(format === 'json'){
                    res.json({ public_photos: publicPhotos, private_photos: privatePhotos, user: req.user });
                }
            });
        }
        else{
            Photo.find({'visiblePublically': true})
                .exec(function(err, photos) {
                if (err) { return next(err) }
                var public_photos = []
                for(var i = 0; i < photos.length; ++i){
                    if(findCommonElement(photos[i].tags, tags)){
                        public_photos.push(photos[i])
                    }
                }
                if(format === 'html'){
                    res.render('search_results', {title: 'Search', public_photos: public_photos, user: req.user, tags: tags })
                }
                else if(format === 'json'){
                    res.json({ public_photos, user: req.user });
                }
            })
        }
    }
    else{
        Photo.find({'visiblePublically': true})
            .exec(function (err, list_photos) {
                if (err) { return next(err) }
                if(format === 'html'){
                    res.render('photos', { title: 'All Photos', photos: list_photos, user: req.user });
                }
                else if(format === 'json'){
                    res.json({ list_photos, user: req.user });
                }
            })
    }
}

exports.photo_list_html = function(req, res) {
    photo_list(req, res, 'html')
}

exports.photo_list_json = function(req, res) {
    photo_list(req, res, 'json')
}

function photo_detail(req, res, next, format){
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        var err = new Error('Invalid Photo ID');
        err.status = 400;
        return next(err);
    }

    Photo.findById(req.params.id).populate('user').exec(function(err, photo){
    if (err) { return next(err); }
    if (photo===null) {
        var err = new Error('Photo not found');
        err.status = 404;
        return next(err);
    }
    User.findById(photo.user.id)
    .exec(function(err, user){
        if (err) { return next(err); }
        if(req.user){
            if(req.user.id === photo.user.id){
                switch(format){
                    case 'html':
                        res.render('photo_detail', { title: 'Photo', photo:photo, photo_user: user, user:req.user, edit: true });
                        break
                    case 'json':
                        res.json({photo: photo.toJSON(), photo_user: user})
                        break
                }
            }
            else if(req.user.id !== photo.user.id && photo.visiblePublically){
                switch(format){
                    case 'html':
                        res.render('photo_detail', { title: 'Photo', photo:photo, photo_user: user, user:req.user, edit: false });
                        break
                    case 'json':
                        res.json({photo: photo.toJSON(), photo_user: user})
                        break
                }
            }
            else if(req.user.id !== photo.user.id && !photo.visiblePublically){
                var err = new Error("You can't access this photo");
                err.status = 404;
                return next(err);
            }
        }
        else{
            if(photo.visiblePublically){
                switch(format){
                    case 'html':
                        res.render('photo_detail', { title: 'Photo', photo:photo, photo_user:user, user:req.user, edit: false });
                        break
                    case 'json':
                        res.json({photo: photo.toJSON(), photo_user: user})
                        break
                }
            }
            else{
                var err = new Error("You can't access this photo");
                err.status = 404;
                return next(err);
            }
        }
    })  
    })
}

exports.photo_detail_html = function(req, res, next) {
   photo_detail(req, res, next, 'html')
}

exports.photo_detail_json = function(req, res, next) {
    photo_detail(req, res, next, 'json')
 }

exports.photo_upload_get = function(req, res) {
    res.render('upload', { title: 'Upload Photo', user:req.user })
}

exports.photo_upload_post =  [
    validator.check('tags').trim(),
    validator.body('tags').escape(),

  async (req, res, next) => {
        const errors = validator.validationResult(req);
        if (!errors.isEmpty()) {
            res.render('upload', { title: 'Upload Photo', user:req.user, errors:errors.array() });
            return;
        }
        if(!req.user){
            res.redirect('/log-in')
            return
        }
        var tags = [];
        var tag_string = req.body.tags;
        if (tag_string.replace(/\s/g, '').length) {
            tags = req.body.tags.split(",");
            for (var i = 0; i < tags.length; i++) tags[i] = tags[i].trim().toLowerCase();
        }
        for(var i = 0; i < req.files.length; ++i){
            var file_url = req.files[i].location
            var isPublic = false
            if(req.body.public == 'on') { isPublic = true }
            await genTags(file_url, tags, isPublic, req.user)
        } 
        req.session['uploaded'] = true;
        res.redirect(req.user.url);
    }
];

exports.photo_delete = function(req, res, next) {
    if (req.user === undefined){
        err.status = 400
        return next(err)
    }
    Photo.findById(req.params.id).populate('user').exec(function(err, photo){ 
        if (err) { return next(err) }
        if(req.user.id !== photo.user.id){
            err.status = 400
            return next(err)
        }
        Photo.findByIdAndDelete(photo._id, function(err) {
            if (err) { return next(err) }
            res.redirect(req.user.url)
        })
    })
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

    var isPublic = false;
    if(req.body.public == 'on') { isPublic = true; }

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
            visiblePublically: isPublic,
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

async function genTags(file_url, tags, isPublic, user) {
    const client = new vision.ImageAnnotatorClient();
  
    const [result] = await client.labelDetection(file_url);
    
    const labels = result.labelAnnotations;
    generated_tags = []
    labels.forEach(label => generated_tags.push(label.description.toLowerCase()));

    tags = tags.concat(generated_tags)
    var photo = new Photo({ 
        user: user,
        image: file_url,
        visiblePublically: isPublic,
        tags: tags
    })
    await photo.save(function (err) {
        if (err) { return next(err); }
    })
}
