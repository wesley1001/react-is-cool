'use strict';

let request = require('request');
let csv = require('csv');
let iconv = require('iconv-lite');

let cons = require('./cons');

module.exports = {
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
                    console.log(output);

                    db.getConnection(function(err, connection) {
                        if (err) {
                            console.error("cannot get db connection.");
                            console.log(err);
                        } else {
                            output.map(function(stockData) {
                                connection.query('INSERT INTO t_stock_list SET ?',
                                {
                                    stock_id: stockData[0],
                                    stock_name: stockData[1],
                                    industry: stockData[2],
                                    area: stockData[3],
                                    pe: stockData[4],
                                    outstanding: stockData[5],
                                    totals: stockData[6],
                                    totalAssets: stockData[7],
                                    liquidAssets: stockData[8],
                                    fixedAssets: stockData[9],
                                    reserved: stockData[10],
                                    reservedPerShare: stockData[11],
                                    eps: stockData[12],
                                    bvps: stockData[13],
                                    pb: stockData[14],
                                    timeToMarket: stockData[15]
                                }, function(err, result) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("created new stock, the id is " + stockData[0]);
                                    }
                                });
                            });

                            connection.release();
                        }
                    });
                });
            } else {
                console.error(error);
            }
        });
    },
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
    }
};
