var BaseController = require("./Base"),
    View = require("../views/Base"),
    model = new (require("../models/ContentModel"));

var request = require('request');

module.exports = BaseController.extend({
    name: "Home",
    content: null,
    run: function(req, res, next) {
        model.setDB(req.db);

        console.log(req.query["search"]);

        var search = req.query["search"];

        var v = new View(res, 'home');

        if (search) {
            var options = {
                url: 'https://api.wmcloud.com/data/v1//api/market/getMktEqud.json?field=&beginDate=&endDate=&secID=' +
                    '&ticker=' + search + '&tradeDate=20140103',
                headers: {
                    Authorization: 'Bearer 9f32e4b8478f76b37c29b266a11f630b46e556c7cbd8edf9d1295482ca02d8af'
                }
            };

            request(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    var info = JSON.parse(body);

                    if (info.retCode == 1) {
                        v.render({
                            secShortName: info.data[0].secShortName,
                            tradeDate: info.data[0].tradeDate,
                            highestPrice: info.data[0].highestPrice,
                            lowestPrice: info.data[0].lowestPrice,
                            closePrice: info.data[0].closePrice
                        });
                    } else {
                        v.render({ secShortName: '无法查询到相关数据' });
                    }
                } else {
                    console.error(error);
                }
            });
        } else {
            v.render({ secShortName: '请输入要查询的股票代码' });
        }

        //var self = this;
        //this.getContent(function() {
        //    var v = new View(res, 'home');
        //    //v.render(self.content);
        //    v.render({ test: "ok" });
        //})
    },
    getContent: function(callback) {
        var self = this;
        this.content = {};
        model.getlist(function(err, records) {
            if(records.length > 0) {
                self.content.bannerTitle = records[0].title;
                self.content.bannerText = records[0].text;
            }
            model.getlist(function(err, records) {
                var blogArticles = '';
                if(records.length > 0) {
                    var to = records.length < 5 ? records.length : 4;
                    for(var i=0; i<to; i++) {
                        var record = records[i];
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