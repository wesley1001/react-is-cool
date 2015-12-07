'use strict';

let request = require('request');
let csv = require('csv');
let iconv = require('iconv-lite');
let colors = require('colors');
let co = require('co')

let cons = require('./cons');
let stockHelper = require('../helper/stock-helper')

module.exports = {
    // 保存RSI数据
    saveRSIData: function(connection, data) {
        let q = connection.query('INSERT INTO t_stock_rsi SET ?',
            data, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("created new stock rsi, the id is %s".green,
                        result.insertId);
                }
            });

        console.log(q.sql);
    },
    // 获取股票基本信息
    getStockList: function(db) {
        let options = {
            url: cons.STOCK_LIST_URL,
            encoding: null
        };

        request(options, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                let str = iconv.decode(body, 'gbk');
                console.log(str);

                csv.parse(str, {}, function(err, output){
                    //console.log(output);

                    db.getConnection(function(err, connection) {
                        if (err) {
                            console.error("cannot get db connection.");
                            console.log(err);
                        } else {
                            // 1. 去除第一行标题 2. 将字符串转为数字型 3. 处理入市日期为0的数据
                            let convertedData = output.slice(1).map(function(data) {
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
                                function(err, result) {
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
    },
    // 获取历史交易信息
    getTransactionHistory: function(db, stockId) {
        if (stockId) {
            let options = {
                url: cons.STOCK_TRANSACTION_HISTORY_URL + stockHelper.codeToSymbol(stockId) + '&type=last',
                json: true
            };
            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    //console.log(body);

                    if (body['record'].length > 0) {                        // 防止空数据
                        // 1. 将字符串转为数字型, 2. 将日均量中的逗号去除
                        let convertedData = body['record'].map(function(data) {
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

                        db.getConnection(function(err, connection) {
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
    },
    // 获取所有历史交易信息
    getAllTransactionHistory: function(db) {
        let self = this;

        db.getConnection(function(err, connection) {
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
                            self.refreshIntervalId = setInterval(function() {
                                if (i < result.length) {
                                    console.log(i);
                                    self.getTransactionHistory(db, result[i].stock_id);
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
    },
    // 获取日交易详情
    getDailyQuote: function(db, stockId) {
        if (stockId) {
            let options = {
                url: cons.STOCK_DAILY_QUOTE_URL + stockId,
                encoding: null
            };

            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);

                    let str = iconv.decode(body, 'gbk');
                    console.log(str);

                    let stockData = str.split("=");
                    if (stockData.length > 1) {
                        let stockDetails = stockData[1].replace(/"/g, '').replace(';', '').split(',');
                        //console.log(stockDetails);

                        db.getConnection(function(err, connection) {
                            if (err) {
                                console.error("cannot get db connection.");
                                console.log(err);
                            } else {
                                connection.query('SELECT COUNT(1) AS item_count FROM `t_daily_stock_quote_history` ' +
                                    'WHERE `stock_id` = ? AND `quote_date` = ? AND `quote_time` = ?',
                                    [stockId, stockDetails[30], stockDetails[31]], function(err, results) {
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
                                                }, function(err, result) {
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
    },
    // 计算单只股票某日的RSI指数
    calculateStockRSI: function(connection, stockId, stockData, index, preUpDownData) {
        let self = this;

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
                            // 第一条不需要计算rsi
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
                            self.saveRSIData(connection, {
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
    },
    // 计算单只股票的所有RSI指数
    calculateStockRSIs: function(db, stockId) {
        console.log('Calculating RSI...'.yellow);

        let self = this;

        if (stockId) {
            db.getConnection(function(err, connection) {
                if (err) {
                    console.error("cannot get db connection.".red);
                    console.log(err);
                } else {
                    // 获取此股票的所有交易日数据
                    let query = connection.query('SELECT `date`, close FROM t_stock_transaction_history ' +
                        'WHERE stock_id = ? order by `date`',
                        [stockId],
                        function (err, result) {
                            if (err) {
                                console.error('%s'.red, err);
                            } else {
                                self.result = result;

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
                                        preUpDownData = yield self.calculateStockRSI(
                                            connection, stockId, result, i, preUpDownData);
                                    }
                                }).then(function () {
                                    console.log('Calculate RSI done.'.green);
                                });
                            }
                        });

                    //console.log(query.sql);

                    connection.release();
                }
            });
        } else {
            console.log("please input a valid stock id.".red);
        }
    }
};
