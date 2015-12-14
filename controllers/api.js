'use strict';

let express = require('express');
let router = express.Router();
let colors = require('colors');
let co = require('co');

let stock = require('../services/stock');

//let data = [
//    {id: 1, author: "Kevin Gu", text: "This is one comment"},
//    {id: 2, author: "Jordan Walke", text: "This is *another* comment"}
//];

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});
// define the home page route
router.get('/filterStockMagic', function(req, res) {
    co(function* () {
        let result = yield stock.filterStockMagic(req.db);

        res.json(result);
    });
});

//router.get('/comments', function(req, res) {
//    res.json(data);
//});
//
//router.post('/comments', function(req, res) {
//    data.push({id: (data.length + 1), author: req.body.author, text: req.body.text});
//
//    res.json(data);
//});

module.exports = router;