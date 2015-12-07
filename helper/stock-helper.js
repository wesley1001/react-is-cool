'use strict';
let cons = require('../services/cons');
var colors = require('colors');

module.exports = {
    // 股票ID转成程股票代码
    codeToSymbol: function(code) {
        if (code.length !== 6) {
            return '';
        } else {
            return '56'.includes(code[0]) ? 'sh' + code : 'sz' + code;
        }
    },
    calculateSimpleAverage: function(arr, n) {
        return arr.reduce(function(a, b) {
            return a + b;
        }) / n;
    },
    /**
     * 强弱指标的计算公式如下：
     * RSI＝[上升平均数÷(上升平均数＋下跌平均数)]×100
     *　　具体方法：
     *　　上升平均数是在某一段日子里升幅数的平均而下跌平均数则是在同一段日子里跌幅数的平均。例如我们要计算九日RSI，首先就要找出前九日内的上升平均数及下跌平均数，举例子如下：
     *　　日数收市价升跌
     *　　第一天23．70
     *　　第二天27．90 \ 4．20
     *　　第三天26．50 \ 1．40
     *　　第四天29．60 \ 3．10
     *　　第五天31．10 \ 1．50
     *　　第六天29．40 \ 1．70
     *　　第七天25．50 \ 3．90
     *　　第八天28．90 \ 3．40
     *　　第九天20．50 \ 8．40
     *　　第十天23．20 \ 2．80
     *　　（1－10天之和)＋15．00＋15．40
     *　　──────────────────
     *（9天内）上升平均值：15÷9＝1．67 （9天内）下跌平均值：15．40÷9＝1．71
     *　　第十天上升平均数=(4.20+3.10+1.50+3.40+2.80)/9=1.67
     *　　第十天下降平均数=(1.40+1.70+3.90+8.40)/9=1.71
     *　　第十天RSI=[1.67÷(1.67+1.71)]×100=49.41
     *　　如果第十一天收市价为25.30,则
     *　　第十一天上升平均数=(1.67×8+2.10)÷9=1.72
     *　　第十一天下跌平均数=1.71×8÷9=1.52
     *　　第十一天RSI=[1.72÷(1.72+1.52)]×100=53.09
     *　　据此可计算以后几天的RSI。
     *
     * @param stockTransaction
     * @param rsi
     */
    calculateRSI: function(stockTransaction, rsi, pre_up, pre_down) {
        let up_avg = 0
            , down_avg = 0;

        console.log(stockTransaction);

        let base = stockTransaction[0];

        console.log(base);

        // 采用指数平均法计算。
        let result = stockTransaction[1] - base;

        console.log('%s'.yellow, result);

        if (result > 0) {
            up_avg = (pre_up * (rsi - 1) + result) / rsi;
            down_avg = pre_down * (rsi - 1) / rsi;
        } else {
            up_avg = pre_up * (rsi - 1) / rsi;
            down_avg = (pre_down * (rsi - 1) + Math.abs(result)) / rsi;
        }

        return [up_avg / (up_avg + down_avg) * 100, up_avg, down_avg];
    }
}