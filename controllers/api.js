'use strict';

// 引入第三方库
let express = require('express');
let router = express.Router();
let colors = require('colors');
let co = require('co');
let moment = require('moment');

// 引入自有库
let cons = require('../services/cons');
let stock = require('../services/stock');
let stockHelper = require('../helper/stock-helper')

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
    console.log('Request Time: %s'.yellow, moment().format('YYYY-MM-DD, HH:mm:ss'));
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
    let dealDate = req.query.dealDate ? req.query.dealDate : moment().format('YYYY-MM-DD');

    req.redis.get('filterStock_' + dealDate, function (err, replies) {
        co(function* () {
            let data = [];

            if (replies) {
                data = JSON.parse(replies);
            } else {
                data = yield stock.getStockAnalysisData(req.db, dealDate);

                // 保存数据到缓存
                req.redis.set('filterStock_' + dealDate, JSON.stringify(data), function (err, reply) {
                    if (err) {
                        console.log('update redis stock failure. %s'.red, err);
                    } else {
                        // 设置数据在缓存中的时间为1天
                        req.redis.expire('filterStockMagic', cons.SECONDS_OF_A_DAY);
                    }
                });
            }

            if (req.query.rsi) {
                let rsi = req.query.rsi;

                let result = [];

                if (rsi.indexOf('and') > -1) {
                    result = stockHelper.filterRSI(rsi.split('and')[1], stockHelper.filterRSI(rsi.split('and')[0], data))
                } else if (rsi.indexOf('or') > -1) {
                    let result1 = stockHelper.filterRSI(rsi.split('or')[0], data);
                    let result2 = stockHelper.filterRSI(rsi.split('or')[1], data);

                    result = result1.concat(result2);
                } else {
                    result = stockHelper.filterRSI(rsi, data);
                }

                // 将数据整形，然后过滤数据
                //console.log(result);

                res.json(result);
            } else {
                res.json(data);
            }
        });
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