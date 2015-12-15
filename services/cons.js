'use strict';

module.exports = {
    RSI1: 6,
    RSI2: 12,
    RSI3: 24,

    TOP_STOCK_COUNT: 3,
    TOP_STOCK_LIMIT: 10,

    // MySQL数据库连接字符串
    MYSQL_CONNECTION_STRING: {
        connectionLimit: 10,
        host: '192.168.3.83',
        user: 'appuser',
        password: 'Ftit654321',
        database: 'ftit_stock_dev'
    },

    // Redis数据库连接字符串
    REDIS_CONNECTION_STRING: {
        host: '192.168.3.85',
        port: 6379
    },

    STOCK_LIST_URL: 'http://218.244.146.57/static/all.csv',
    STOCK_DAILY_QUOTE_URL: 'http://hq.sinajs.cn/list=sh',
    STOCK_TRANSACTION_HISTORY_URL: 'http://api.finance.ifeng.com/akdaily/?code='
}