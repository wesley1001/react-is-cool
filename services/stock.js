'use strict';

// 引入第三方库
let request = require('request');
let csv = require('csv');
let iconv = require('iconv-lite');
let colors = require('colors');
let co = require('co')
let underscore = require('underscore');
let Immutable = require('immutable');

// 引入自有库
let cons = require('./cons');
let stockHelper = require('../helper/stock-helper')

/**
 * 保存RSI数据
 * @param connection 数据库连接
 * @param data RSI数据
 */
function saveRSIData(connection, data) {
    let q = connection.query('INSERT INTO t_stock_rsi SET ?',
        data, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log("created new stock rsi, the id is %s".green,
                    result.insertId);
            }
        });

    console.log(q.sql);
}

/** 抓取所有股票的基本信息并保存到数据库中
 * @param db
 */
function fetchStockList(db) {
    let options = {
        url: cons.STOCK_LIST_URL,
        encoding: null
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let str = iconv.decode(body, 'gbk');
            console.log(str);

            csv.parse(str, {}, function (err, output) {
                //console.log(output);

                db.getConnection(function (err, connection) {
                    if (err) {
                        console.error("cannot get db connection.");
                        console.log(err);
                    } else {
                        // 1. 去除第一行标题 2. 将字符串转为数字型 3. 处理入市日期为0的数据
                        let convertedData = output.slice(1).map(function (data) {
                            return [
                                data[0],
                                data[1],
                                data[2],
                                data[3],
                                Number(data[4]),
                                Number(data[5]),
                                Number(data[6]),
                                Number(data[7]),
                                Number(data[8]),
                                Number(data[9]),
                                Number(data[10]),
                                Number(data[11]),
                                Number(data[12]),
                                Number(data[13]),
                                Number(data[14]),
                                data[15] == '0' ? '0000-00-00' : data[15],
                            ];
                        });
                        //console.log(convertedData);

                        let query = connection.query('INSERT INTO t_stock_list ' +
                            '(stock_id, stock_name, industry, area, pe,' +
                            'outstanding, totals, totalAssets, liquidAssets, fixedAssets,' +
                            'reserved, reservedPerShare, eps, bvps, pb, timeToMarket) VALUES ?',
                            [convertedData],
                            function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("created/updated stock list successful.");
                                }
                            });

                        //console.log(query.sql);

                        connection.release();
                    }
                });
            });
        } else {
            console.error(error);
        }
    });
}

/**
 * 读取所有股票的基本信息
 * @param db 数据库连接池
 */
function getAllStocksBaseInfo (db) {
    return new Promise(function (resolve, reject) {
        db.getConnection(function (err, connection) {
            if (err) {
                console.error("cannot get db connection. \n%s".red, err);

                reject(err);
            } else {
                connection.query('SELECT stock_id, stock_name FROM t_stock_list',
                    [],
                    function (err, result) {
                        if (err) {
                            console.error('%s'.red, err);

                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
            }
        });
    });
}

// 获取历史交易信息
function getTransactionHistory(db, stockId) {
    if (stockId) {
        let options = {
            url: cons.STOCK_TRANSACTION_HISTORY_URL + stockHelper.codeToSymbol(stockId) + '&type=last',
            json: true
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                //console.log(body);

                if (body['record'].length > 0) {                        // 防止空数据
                    // 1. 将字符串转为数字型, 2. 将日均量中的逗号去除
                    let convertedData = body['record'].map(function (data) {
                        return [
                            stockId,
                            data[0],
                            Number(data[1]),
                            Number(data[2]),
                            Number(data[3]),
                            Number(data[4]),
                            Number(data[5]),
                            Number(data[6]),
                            Number(data[7]),
                            Number(data[8]),
                            Number(data[9]),
                            Number(data[10]),
                            Number(data[11].replace(/,/g, '')),
                            Number(data[12].replace(/,/g, '')),
                            Number(data[13].replace(/,/g, '')),
                            Number(data[14]),
                        ];
                    });
                    //console.log(convertedData);

                    db.getConnection(function (err, connection) {
                        if (err) {
                            console.error("cannot get db connection.");
                            console.log(err);
                        } else {
                            let query = connection.query('INSERT INTO t_stock_transaction_history ' +
                                '(stock_id, date, open, high, close,' +
                                'low, volume, price_change, p_change, ma5,' +
                                'ma10, ma20, v_ma5, v_ma10, v_ma20, turnover) VALUES ?',
                                [convertedData],
                                function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("created stock transaction history successful.");
                                    }
                                });

                            console.log(query.sql);

                            connection.release();
                        }
                    });
                }
            } else {
                console.error(error);
            }
        });
    } else {
        console.log("please input a valid stock id.");
    }
}

// 获取所有历史交易信息
function getAllTransactionHistory(db) {
    let self = this;

    db.getConnection(function (err, connection) {
        if (err) {
            console.error("cannot get db connection.");
            console.log(err);
        } else {
            let query = connection.query('SELECT stock_id FROM t_stock_list',
                null,
                function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        let i = 1234;
                        self.refreshIntervalId = setInterval(function () {
                            if (i < result.length) {
                                console.log(i);
                                getTransactionHistory(db, result[i].stock_id);
                                i++;
                            } else {
                                clearInterval(self.refreshIntervalId);
                                console.log("get all transaction history done.");
                            }
                        }, 1000);   // 增加延时，防止被block
                    }
                });

            console.log(query.sql);

            connection.release();
        }
    });
    //this.getTransactionHistory(db, '601006');
}

// 获取日交易详情
function getDailyQuote(db, stockId) {
    if (stockId) {
        let options = {
            url: cons.STOCK_DAILY_QUOTE_URL + stockId,
            encoding: null
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);

                let str = iconv.decode(body, 'gbk');
                console.log(str);

                let stockData = str.split("=");
                if (stockData.length > 1) {
                    let stockDetails = stockData[1].replace(/"/g, '').replace(';', '').split(',');
                    //console.log(stockDetails);

                    db.getConnection(function (err, connection) {
                        if (err) {
                            console.error("cannot get db connection.");
                            console.log(err);
                        } else {
                            connection.query('SELECT COUNT(1) AS item_count FROM `t_daily_stock_quote_history` ' +
                                'WHERE `stock_id` = ? AND `quote_date` = ? AND `quote_time` = ?',
                                [stockId, stockDetails[30], stockDetails[31]], function (err, results) {
                                    //console.log(results);
                                    if (results[0]['item_count'] == 0) {
                                        connection.query('INSERT INTO t_daily_stock_quote_history SET ?',
                                            {
                                                stock_id: stockId,
                                                stock_name: stockDetails[0],
                                                today_opening_price: stockDetails[1],
                                                yesterday_closing_price: stockDetails[2],
                                                current_price: stockDetails[3],
                                                today_highest_price: stockDetails[4],
                                                today_lowest_price: stockDetails[5],
                                                buy_price: stockDetails[6],
                                                sell_price: stockDetails[7],
                                                deal_quantity: stockDetails[8],
                                                deal_amount: stockDetails[9],
                                                buy_one_quantity: stockDetails[10],
                                                buy_one_price: stockDetails[11],
                                                buy_two_quantity: stockDetails[12],
                                                buy_two_price: stockDetails[13],
                                                buy_three_quantity: stockDetails[14],
                                                buy_three_price: stockDetails[15],
                                                buy_four_quantity: stockDetails[16],
                                                buy_four_price: stockDetails[17],
                                                buy_five_quantity: stockDetails[18],
                                                buy_five_price: stockDetails[19],
                                                sell_one_quantity: stockDetails[20],
                                                sell_one_price: stockDetails[21],
                                                sell_two_quantity: stockDetails[22],
                                                sell_two_price: stockDetails[23],
                                                sell_three_quantity: stockDetails[24],
                                                sell_three_price: stockDetails[25],
                                                sell_four_quantity: stockDetails[26],
                                                sell_four_price: stockDetails[27],
                                                sell_five_quantity: stockDetails[28],
                                                sell_five_price: stockDetails[29],
                                                quote_date: stockDetails[30],
                                                quote_time: stockDetails[31]
                                            }, function (err, result) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    console.log("created new daily stock quote, the id is " + result.insertId);
                                                }
                                            });
                                    } else {
                                        console.log("this daily stock quote has created.");
                                    }
                                });

                            connection.release();
                        }
                    });
                }
            } else {
                console.error(error);
            }
        });
    } else {
        console.log("please input a valid stock id.");
    }
}

/**
 * 获取指定股票的交易行情
 * @param connection 数据库连接
 * @param stockId 股票代码
 * @param dealDate 交易日期
 */
function getStockTransactionByDate (connection, stockId, dealDate) {
    //console.log('get %s stock transaction...'.yellow, stockId);

    return new Promise(function (resolve, reject) {
        // 获取此股票的指定交易日数据
        let query = connection.query('SELECT t_stock.stock_id, t_stock.stock_name, t_trans.close, t_trans.date ' +
            'FROM t_stock_list t_stock, t_stock_transaction_history t_trans ' +
            'WHERE t_stock.stock_id = t_trans.stock_id ' +
            'AND t_stock.stock_id = ? ' +
            'AND t_trans.date >= ? ' +
            'ORDER BY t_trans.date ' +
            'LIMIT 1',
            [stockId, dealDate],
            function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });

        //console.log(query.sql);
    });
}

/**
 * 获取指定股票集的交易行情
 * @param db
 * @param stocks
 * @returns {Promise}
 */
function getStockTransactionsByDate (db, stocks, dealDate) {
    return new Promise(function (resolve, reject) {
        db.getConnection(function (err, connection) {
            if (err) {
                console.error("cannot get db connection. \n%s".red, err);

                reject(err);
            } else {
                co(function* () {
                    let result = [];

                    for (let i = 0; i < stocks.length; i++) {
                        let data = yield getStockTransactionByDate(connection, stocks[i]['stock_id'], dealDate);
                        result.push(data.slice(0, 1));
                    }

                    return result;
                }).then(function (val) {
                    connection.release();

                    resolve([].concat.apply([], val));
                });
            }
        });
    });
}

/**
 * 获取指定股票的指定交易日之前的交易行情
 * @param db
 * @param stocks
 * @returns {Promise}
 */
function getStockTransactionTileDate (db, stockId, dealDate) {
    return new Promise(function (resolve, reject) {
        db.getConnection(function (err, connection) {
            if (err) {
                console.error("cannot get db connection. \n%s".red, err);

                reject(err);
            } else {
                // 获取此股票的指定交易日数据
                let query = connection.query('SELECT t_stock.stock_id, t_stock.stock_name, DATE_FORMAT(t_trans.date, "%Y-%m-%d") AS date, ' +
                    't_trans.open, t_trans.close, t_trans.high, t_trans.low, t_trans.volume ' +
                    'FROM t_stock_list t_stock, t_stock_transaction_history t_trans ' +
                    'WHERE t_stock.stock_id = t_trans.stock_id ' +
                    'AND t_stock.stock_id = ? ' +
                    'AND t_trans.date <= ? ' +
                    'ORDER BY t_trans.date ',
                    [stockId, dealDate],
                    function (err, result) {
                        if (err) {
                            connection.release();

                            reject(err);
                        } else {
                            connection.release();

                            resolve(result);
                        }
                    });

                console.log(query.sql);
            }
        });
    });
}

/**
 * 计算单只股票某日的RSI指数
 * @param connection 数据库连接
 * @param stockId 股票Id
 * @param stockData 股票行情数据 ex: [{date: 2015-12-01, close: 10.1} {date: 2015-12-02, close: 11.2} ...]
 * @param index 需要计算RSI指数在行情数据中的位置
 * @param preUpDownData 上一日的上涨下跌平均值
 * @returns {Promise}
 */
function calculateStockRSI(connection, stockId, stockData, index, preUpDownData) {
    let transactions = stockData.map(x => x.close);

    return new Promise(function (resolve, reject) {
        let rsi1 = [100, 0, 0]
            , rsi2 = [100, 0, 0]
            , rsi3 = [100, 0, 0];

        // 查看当前日期是否已经计算过rsi，如果是，就取出上涨平均值和下跌平均值，否则计算rsi
        connection.query('SELECT rsi1_up_avg, rsi1_down_avg, rsi2_up_avg, rsi2_down_avg, ' +
            'rsi3_up_avg, rsi3_down_avg FROM t_stock_rsi ' +
            'WHERE stock_id = ? AND  `date` = ?',
            [stockId, stockData[index].date],
            function (err, result) {
                if (err) {
                    console.error('%s'.red, err);

                    reject(err);
                } else {
                    if (result.length == 0) {
                        // 第一条不需要计算rsi，直接就是100
                        if (index > 0) {
                            rsi1 = stockHelper.calculateRSI(
                                transactions.slice(index - 1, index + 1), cons.RSI1,
                                preUpDownData.pre_up1, preUpDownData.pre_down1);

                            rsi2 = stockHelper.calculateRSI(
                                transactions.slice(index - 1, index + 1), cons.RSI2,
                                preUpDownData.pre_up2, preUpDownData.pre_down2);

                            rsi3 = stockHelper.calculateRSI(
                                transactions.slice(index - 1, index + 1), cons.RSI3,
                                preUpDownData.pre_up3, preUpDownData.pre_down3);
                        }

                        // 保存RSI数据
                        saveRSIData(connection, {
                            stock_id: stockId,
                            date: stockData[index].date,
                            rsi1_up_avg: rsi1[1],
                            rsi1_down_avg: rsi1[2],
                            rsi1: rsi1[0],
                            rsi2_up_avg: rsi2[1],
                            rsi2_down_avg: rsi2[2],
                            rsi2: rsi2[0],
                            rsi3_up_avg: rsi3[1],
                            rsi3_down_avg: rsi3[2],
                            rsi3: rsi3[0]
                        });

                        // 取出上涨平均值和下跌平均值
                        preUpDownData.pre_up1 = rsi1[1];
                        preUpDownData.pre_down1 = rsi1[2];
                        preUpDownData.pre_up2 = rsi2[1];
                        preUpDownData.pre_down2 = rsi2[2];
                        preUpDownData.pre_up3 = rsi3[1];
                        preUpDownData.pre_down3 = rsi3[2];
                    } else {
                        // 取出上涨平均值和下跌平均值
                        preUpDownData.pre_up1 = result[0]['rsi1_up_avg'];
                        preUpDownData.pre_down1 = result[0]['rsi1_down_avg'];
                        preUpDownData.pre_up2 = result[0]['rsi2_up_avg'];
                        preUpDownData.pre_down2 = result[0]['rsi2_down_avg'];
                        preUpDownData.pre_up3 = result[0]['rsi3_up_avg'];
                        preUpDownData.pre_down3 = result[0]['rsi3_down_avg'];
                    }

                    resolve(preUpDownData)
                }
            }
        )
        //console.log(q.sql);
    })
}

/**
 * 计算单只股票的所有RSI指数
 * @param db 数据库连接池
 * @param stockId 股票Id
 */
function calculateStockRSIs(db, stockId) {
    console.log('Calculating RSI...'.yellow);

    if (stockId) {
        db.getConnection(function (err, connection) {
            if (err) {
                console.error("cannot get db connection. \n%s".red, err);
            } else {
                // 获取此股票的所有交易日数据
                connection.query('SELECT `date`, close FROM t_stock_transaction_history ' +
                    'WHERE stock_id = ? order by `date`',
                    [stockId],
                    function (err, result) {
                        if (err) {
                            console.error('%s'.red, err);
                        } else {
                            co(function* () {
                                let preUpDownData = {
                                    pre_up1: 0,
                                    pre_down1: 0,
                                    pre_up2: 0,
                                    pre_down2: 0,
                                    pre_up3: 0,
                                    pre_down3: 0
                                };

                                for (let i = 0; i < result.length; i++) {
                                    // 计算RSI指数
                                    preUpDownData = yield calculateStockRSI(
                                        connection, stockId, result, i, preUpDownData);
                                }
                            }).then(function () {
                                console.log('Calculate RSI done.'.green);

                                connection.release();
                            });
                        }
                    });
            }
        });
    } else {
        console.log("please input a valid stock id.".red);
    }
}

/**
 * 获取指定行业的近期涨停最多的股票
 * @param connection 数据库连接
 * @param industry 行业
 * @param from 开始日期
 * @param to 结束日期
 * @param up_limit 上涨幅度
 * @param c 股票数量
 */
function getTopStocksOfIndustry (connection, industry, from, to, up_limit, c) {
    console.log('get top stocks of %s...'.yellow, industry);

    return new Promise(function (resolve, reject) {
        // 获取此股票的所有交易日数据
        let query = connection.query('SELECT t_stock.stock_id, t_stock.stock_name, COUNT(1) as UP_COUNT ' +
            'FROM t_stock_list t_stock, t_stock_transaction_history t_trans ' +
            'WHERE t_stock.stock_id = t_trans.stock_id ' +
            'AND t_stock.industry = ? ' +
            'AND t_trans.date between ? and ? ' +
            'AND t_trans.p_change >= ? ' +
            'GROUP BY t_stock.stock_id, t_stock.stock_name ' +
            'ORDER BY COUNT(1) DESC ' +
            'LIMIT ?',
            [industry, from, to, up_limit, c],
            function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.map(x => {
                        x.industry = industry;
                        return x;
                    }));
                }
            });

        //console.log(query.sql);
    });
}

/**
 * 获取每个行业的近期涨停最多的股票
 * @param db 数据库连接池
 */
function getTopStocksPerIndustry (db, dealDate, topLimit, topCount) {
    return new Promise(function (resolve, reject) {
        db.getConnection(function (err, connection) {
            if (err) {
                console.error("cannot get db connection. \n%s".red, err);

                reject(err);
            } else {
                // 提取最近一个月的起始日期
                let from = new Date(dealDate);
                from.setMonth(from.getMonth() - 1);

                let to = new Date(dealDate);
                to.setDate(to.getDate() - 1);

                // 获取此股票的所有交易日数据
                connection.query('SELECT industry FROM t_stock_list GROUP BY industry',
                    [],
                    function (err, result) {
                        if (err) {
                            console.error('%s'.red, err);
                        } else {
                            console.log(result);
                            co(function* () {
                                let stocks = yield result.map(x => getTopStocksOfIndustry(
                                    connection, x['industry'],
                                    from,
                                    to,
                                    topLimit,
                                    topCount));

                                return stocks;
                            }).then(function (val) {
                                console.log('get top stocks per industry done.'.green);

                                connection.release();

                                console.log([].concat.apply([], val));
                                resolve([].concat.apply([], val));
                            });
                        }
                    });
            }
        });
    });
}

/**
 * 获取指定股票的RSI指数
 * @param connection
 * @param stockId
 * @returns {Promise}
 */
function getStockRSI (connection, stockId, dealDate) {
    return new Promise(function (resolve, reject) {
        // 获取此股票的指定交易日的RSI数据
        let query = connection.query('SELECT rsi.stock_id, stock.stock_name, t_trans.close, rsi.rsi1, rsi.rsi2, rsi.rsi3, ' +
            'DATE_FORMAT(rsi.`date`, "%Y-%m-%d") as `date`, stock.industry, t_trans.p_change ' +
            'FROM t_stock_rsi rsi, t_stock_list stock, t_stock_transaction_history t_trans ' +
            'WHERE rsi.stock_id = ? AND rsi.stock_id = stock.stock_id AND DATE_FORMAT(rsi.`date`, "%Y-%m-%d") = ? ' +
            ' AND t_trans.stock_id = stock.stock_id AND DATE_FORMAT(t_trans.`date`, "%Y-%m-%d") = ? ',
            [stockId, dealDate, dealDate],
            function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });

        console.log(query.sql);
    });
}

/**
 * 获取指定股票集的RSI指数
 * @param db
 * @param stocks
 * @returns {Promise}
 */
function getStocksRSI (db, stocks, dealDate) {
    return new Promise(function (resolve, reject) {
        db.getConnection(function (err, connection) {
            if (err) {
                console.error("cannot get db connection. \n%s".red, err);

                reject(err);
            } else {
                co(function* () {
                    let result = [];

                    for (let i = 0; i < stocks.length; i++) {
                        let data = yield getStockRSI(connection, stocks[i]['stock_id'], dealDate);
                        result.push(data.slice(0, 1));
                    }

                    return result;
                }).then(function (val) {
                    connection.release();

                    resolve(val);
                });
            }
        });
    });
}

/**
 * 过滤股票
 * @param db 数据库连接
 * @param dealDate 交易日期
 */
function getStockAnalysisData (db, dealDate, topLimit, topCount) {
    return new Promise(function (resolve, reject) {
        co(function* () {
            // 获取每个行业的近期涨停最多的股票
            let topStocks = yield getTopStocksPerIndustry(db, dealDate, topLimit, topCount);
            // 获取对应股票的RSI指数
            let stockRSIs = yield getStocksRSI(db, topStocks, dealDate);

            return [].concat.apply([], stockRSIs);
        }).then(function (val) {
            resolve(val);
        });
    });
}

/**
 * 更新所有股票的RSI指数
 * @param db
 */
function updateAllStocksRSI (db) {
    co(function* () {
        let stocks = yield getAllStocksBaseInfo(db);
        stocks.forEach(stock => {
            calculateStockRSIs(db, stock['stock_id']);
        });
    }).then(function () {
        console.log('update all stocks RSI done.'.green)
    });
}

module.exports = {
    calculateStockRSIs: calculateStockRSIs,
    updateAllStocksRSI: updateAllStocksRSI,
    getTopStocksPerIndustry: getTopStocksPerIndustry,
    getStockAnalysisData: getStockAnalysisData,
    getStockTransactionsByDate: getStockTransactionsByDate,
    getStockTransactionTileDate: getStockTransactionTileDate
};