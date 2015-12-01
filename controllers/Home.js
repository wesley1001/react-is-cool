'use strict';

let BaseController = require("./Base"),
    View = require("../views/Base"),
    model = new (require("../models/ContentModel"));

let request = require('request');

module.exports = BaseController.extend({
    name: "Home",
    content: null,
    run: function(req, res, next) {
        model.setDB(req.db);

        console.log(req.query["search"]);

        const search = req.query["search"];

        let v = new View(res, 'home');

        if (search) {
            let options = {
                //url: 'https://api.wmcloud.com/data/v1//api/market/getMktEqud.json?field=&beginDate=&endDate=&secID=' +
                //    '&ticker=' + search + '&tradeDate=20140103',
                ////url: 'https://api.wmcloud.com/data/v1//api/market/getBarRTIntraDay.json?securityID=' + search +
                ////    '&startTime=&endTime=&type=',
                //headers: {
                //    Authorization: 'Bearer 9f32e4b8478f76b37c29b266a11f630b46e556c7cbd8edf9d1295482ca02d8af'
                //}

                url: 'http://hq.sinajs.cn/list=sh' + search
            };

            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);

                    let stockData = body.split("=");
                    if (stockData.length > 1) {
                        let stockDetails = stockData[1].replace(/"/g, '').replace(';', '').split(',');
                        console.log(stockDetails);

                        req.db.getConnection(function(err, connection) {
                           if (err) {
                               console.log(err);
                           } else {
                               connection.query('INSERT INTO t_daily_stock_quote_history SET ?',
                                   {
                                       stock_id: search,
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
                                       quote_price: stockDetails[31]
                                   }, function(err, result) {
                                       if (err) console.log(err);

                                       console.log(result.insertId);
                               });
                           }
                        });
                    }

                    //let info = JSON.parse(body);
                    //
                    //if (info.retCode == 1) {
                    //    v.render({
                    //        secShortName: info.data[0].secShortName,
                    //        tradeDate: info.data[0].tradeDate,
                    //        highestPrice: info.data[0].highestPrice,
                    //        lowestPrice: info.data[0].lowestPrice,
                    //        closePrice: info.data[0].closePrice
                    //    });
                    //} else {
                    //    v.render({ secShortName: '无法查询到相关数据' });
                    //}
                } else {
                    console.error(error);
                }
            });
        } else {
            v.render({ secShortName: '请输入要查询的股票代码' });
        }

        //let self = this;
        //this.getContent(function() {
        //    let v = new View(res, 'home');
        //    //v.render(self.content);
        //    v.render({ test: "ok" });
        //})
    },
    getContent: function(callback) {
        let self = this;
        this.content = {};
        model.getlist(function(err, records) {
            if(records.length > 0) {
                self.content.bannerTitle = records[0].title;
                self.content.bannerText = records[0].text;
            }
            model.getlist(function(err, records) {
                let blogArticles = '';
                if(records.length > 0) {
                    let to = records.length < 5 ? records.length : 4;
                    for(let i=0; i<to; i++) {
                        let record = records[i];
                        blogArticles += '\
							<div class="item">\
	                            <img src="' + record.picture + '" alt="" />\
	                            <a href="/blog/' + record.ID + '">' + record.title + '</a>\
	                        </div>\
						';
                    }
                }
                self.content.blogArticles = blogArticles;
                callback();
            }, { type: 'blog' });
        }, { type: 'home' });
    }
});
