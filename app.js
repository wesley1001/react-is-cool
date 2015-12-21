'use strict';

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let mysql = require('mysql');
let redis = require("redis");
let exphbs  = require('express-handlebars');
let cronJob = require('cron').CronJob;
let colors = require('colors');
let co = require('co')

let cons = require('./services/cons');
let stock = require('./services/stock');
let home = require('./controllers/home');
let api = require('./controllers/api');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/react', express.static(__dirname + '/node_modules/react/dist/'));
app.use('/react-dom', express.static(__dirname + '/node_modules/react-dom/dist/'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
app.use('/react-bootstrap', express.static(__dirname + '/node_modules/react-bootstrap/dist/'));
app.use('/fixed-data-table', express.static(__dirname + '/node_modules/fixed-data-table/dist/'));
app.use('/immutable', express.static(__dirname + '/node_modules/immutable/dist/'));
app.use('/d3', express.static(__dirname + '/node_modules/d3/'));
app.use('/react-stockcharts', express.static(__dirname + '/node_modules/react-stockcharts/dist/'));

/**
 * 连接MySQL数据库
 */
function connectMyDB () {
    return new Promise(function (resolve, reject) {
        let pool = mysql.createPool(cons.MYSQL_CONNECTION_STRING);

        pool.getConnection(function(err, connection) {
            if (err) {
                reject(err);
            } else {
                console.log("[MySQL]数据库准备就绪".green);

                connection.release();

                resolve(pool);
            }
        });
    });
}

/**
 * 连接Redis数据库
 */
function connectRedisDB () {
    return new Promise(function (resolve, reject) {
        let client = redis.createClient(cons.REDIS_CONNECTION_STRING);

        client.on("error", function (err) {
            reject(err);
        });

        client.on("connect", function () {
            console.log("[Redis]数据库准备就绪".green);
            resolve(client);
        });
    });
}

co(function* () {
    // 创建MySQL DB Pool
    let myDBPool = yield connectMyDB();

    // 创建Redis client
    let redisClient = yield connectRedisDB();

    let addDBClient = function (req, res, next) {
        req.db = myDBPool;
        req.redis = redisClient;
        next();
    }

    app.use('/api', addDBClient, api);

    app.use('/*', addDBClient, home);

    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        let err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });

    //var Canvas = require('canvas')
    //    , Image = Canvas.Image
    //    , canvas = new Canvas(200, 200)
    //    , ctx = canvas.getContext('2d');
    //
    //ctx.beginPath();
    //ctx.moveTo(0, 0);
    //ctx.lineTo(200, 200);
    //ctx.stroke();
    //
    //console.log('<img src="' + canvas.toDataURL() + '" />');

    //stock.filterStockMagic(pool);
    //stock.updateAllStocksRSI(pool);
    //stock.getTopStocksPerIndustry(pool);
    //stock.calculateStockRSIs(pool, '600636');
    //stock.calculateStockRSI(pool, '603026');
    //stock.getAllTransactionHistory(pool);
    //stock.getTransactionHistory(pool, '601006');
    //stock.getStockList(pool);
    //let myJob = new cronJob('*/5 * * * * *', function(){
    //    stock.getDailyQuote(pool, '601006');
    //});
    //myJob.start();
}).then(function () {
    console.log('运行环境初始化成功'.green);
}).catch(onerror);

function onerror(err) {
    console.log('%s'.red, err.stack);

    process.exit(1);
}

module.exports = app;
