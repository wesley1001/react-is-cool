'use strict';

let express = require('express');
let router = express.Router();
let colors = require('colors');
let co = require('co');

let cons = require('../services/cons');
let stock = require('../services/stock');

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Time: ', Date.now());
    next();
});

/**
 * @api {get} /api/filterStockMagic Request Magically filter Stock information
 * @apiName FilterStockMagic
 * @apiGroup API
 *
 * @apiSuccess {Array} stock Filtered stock list.
 */
router.get('/filterStockMagic', function(req, res) {
    req.redis.get('filterStockMagic', function (err, replies) {
        if (replies) {
            let data = JSON.parse(replies);

            res.json(data);
        } else {
            co(function* () {
                let result = yield stock.filterStockMagic(req.db);

                // 保存数据到缓存
                req.redis.set('filterStockMagic', JSON.stringify(result), function (err, reply) {
                    if (err) {
                        console.log('update redis stock failure. %s'.red, err);
                    } else {
                        // 设置数据在缓存中的时间为1天
                        req.redis.expire('filterStockMagic', cons.SECONDS_OF_A_DAY);
                    }
                });

                res.json(result);
            });
        }
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