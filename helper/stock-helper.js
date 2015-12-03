'use strict';

module.exports = {
    codeToSymbol: function (code) {
        if (code.length !== 6) {
            return '';
        } else {
            return '56'.includes(code[0]) ? 'sh' + code : 'sz' + code;
        }
    }
}