'use strict';

var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});
// define the home page route
router.get('/', function(req, res) {
    let db = req.db;

    db.getConnection(function (err, connection) {
        if (err) {
            console.error("cannot get db connection. \n%s".red, err);

            res.send('hello');
            reject(err);
        } else {
            res.render('home');
        }
    });
});

module.exports = router;