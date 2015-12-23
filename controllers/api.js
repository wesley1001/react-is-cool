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
 * @api {get} /api/stock/filter 请求过滤股票
 * @apiName 过滤股票
 * @apiGroup api/stock
 *
 * @apiParam {Date} dealDate 交易日期
 * @apiParam {String} rsi rsi参数
 *
 * @apiSuccess {List} 股票列表.
 */
router.get('/stock/filter', function(req, res) {
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

                res.json(result);
            } else {
                res.json(data);
            }
        });
    });
});

/**
 * @api {post} /api/stock/mockBuy 请求模拟买入股票
 * @apiName 模拟买入股票
 * @apiGroup api/stock
 *
 * @apiParam {Date} dealDate 交易日期
 * @apiParam {List} filteredData 股票列表
 *
 * @apiSuccess {List} Filtered stock list.
 */
router.post('/stock/mockBuy', function(req, res) {
    let params = JSON.parse(req.body.jsonData);

    let dealDate = params.dealDate ? params.dealDate : moment().format('YYYY-MM-DD');

    let holdDay = params.holdDay ? params.holdDay : 7;

    console.log('hold day: %s'.red, holdDay);

    co(function* () {
        let stocksOnBuy = yield stock.getStockTransactionsByDate(req.db, params.filteredData, dealDate);

        // 股票销售日期定为买入日期后七天
        let sellDate = new Date((new Date(dealDate)).getTime() + holdDay * 24 * 60 * 60 * 1000);

        //console.log('hold day: %s'.red, new Date(dealDate));
        //console.log('hold day: %s'.red, moment(sellDate).format('YYYY-MM-DD'));

        let stocksOnSell = yield stock.getStockTransactionsByDate(req.db, params.filteredData,
            moment(sellDate).format('YYYY-MM-DD'));

        let mockBuyResult = stocksOnBuy.map(needBuyStock => {
            let buyAmount = needBuyStock.close * 100;

            let sameStock = stocksOnSell.filter(function(value) {
                return value.stock_id == needBuyStock.stock_id;
            });

            if (sameStock.length > 0) {
                let saleAmount = sameStock[0].close * 100;
                return {
                    stockId: needBuyStock.stock_id,
                    buyAmount: buyAmount,
                    saleAmount: saleAmount,
                    diff: saleAmount - buyAmount
                };
            } else {
                return 0;
            }
        });

        console.log('every stock result: %s'.yellow, mockBuyResult.map(x => x.diff));

        let totalResult = mockBuyResult.reduce(function(a, b) {
                return {
                    buyAmount: a.buyAmount + b.buyAmount,
                    saleAmount: a.saleAmount + b.saleAmount,
                    diff: a.diff + b.diff
                };
            });

        res.json({
            buyAmount: totalResult.buyAmount,
            saleAmount: totalResult.saleAmount,
            diff: Math.round(totalResult.diff * 100) / 100,
            holdDay: holdDay
        });
    });
});


/**
 * @api {get} /api/stock/transaction 请求获取股票交易信息
 * @apiName 获取股票交易信息
 * @apiGroup api/stock
 *
 * @apiParam {Date} dealDate 交易日期
 * @apiParam {String} stockId 股票代码
 *
 * @apiSuccess {List} 股票交易信息.
 */
router.get('/stock/transaction', function(req, res) {
    let dealDate = req.query.dealDate;
    let stockId = req.query.stockId;

    co(function* () {
        let stockTrans = yield stock.getStockTransactionTileDate(req.db, stockId, dealDate);

        res.json(stockTrans);

        //res.json(stockTrans.map(x => {
        //    return [x.date, x.open, x.high, x.low, x.close, x.volume, 0];
        //}));
    });
});

module.exports = router;