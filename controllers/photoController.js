var User = require('../models/user');
var Photo = require('../models/photo');

exports.index = function(req, res) {
    res.redirect('/photos');
}

exports.photo_list = function(req, res) {
    res.render('photos', {title: "All Photos"})
}

exports.photo_detail = function(req, res) {
    res.send('photo detail')
}

exports.photo_create_get = function(req, res) {
    res.send('photo detail')
}

exports.photo_create_post = function(req, res) {
    res.send('photo detail')
}

exports.photo_delete_post = function(req, res) {
    res.send('photo detail')
}

exports.photo_update_post = function(req, res) {
    res.send('photo detail')
}

exports.photo_search_get = function(req, res) {
    res.send('photo detail')
}