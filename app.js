'use strict';

let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let mysql = require('mysql');
let exphbs  = require('express-handlebars');
let cronJob = require('cron').CronJob;

let Home = require('./controllers/Home');
let stock = require('./services/stock');

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

// attach mongodb
//mongoose.connect('mongodb://127.0.0.1:27017/reactiscool')

//let db = mongoose.connection;
//
//db.on('error', function(err) {
//    console.log(err);
//    process.exit(1);
//});
//
//db.once('open', function (callback) {
//    console.log("db open");
//
//    app.use('/*', function (req, res, next) {
//        req.db = db;
//        Home.run(req, res, next);
//    });
//
//    // catch 404 and forward to error handler
//    app.use(function(req, res, next) {
//        let err = new Error('Not Found');
//        err.status = 404;
//        next(err);
//    });
//
//    // error handlers
//
//    // development error handler
//    // will print stacktrace
//    if (app.get('env') === 'development') {
//        app.use(function(err, req, res, next) {
//            res.status(err.status || 500);
//            res.render('error', {
//                message: err.message,
//                error: err
//            });
//        });
//    }
//
//    // production error handler
//    // no stacktraces leaked to user
//    app.use(function(err, req, res, next) {
//        res.status(err.status || 500);
//        res.render('error', {
//            message: err.message,
//            error: {}
//        });
//    });
//});


// Attach mysql db
var pool = mysql.createPool({
    connectionLimit: 10,
    host: '192.168.3.83',
    user: 'appuser',
    password: 'Ftit654321',
    database: 'ftit_stock_dev'
})

pool.getConnection(function(err, connection) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        console.log("db is available");

        connection.release();

        app.use('/*', function (req, res, next) {
            req.db = pool;
            Home.run(req, res, next);
        });

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

        let myJob = new cronJob('*/5 * * * * *', function(){
            stock.getDailyQuote(pool, '601006');
        });
        myJob.start();
    }
});

module.exports = app;
