'use strict';

const WXPay = require('./wxpay');
const utils = require('./utils');

module.exports = function initWXPay(config) {
  const wxpay = new WXPay(config);
  return Object.assign(wxpay, utils);
};