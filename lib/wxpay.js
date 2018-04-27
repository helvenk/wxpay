'use strict';

const debug = require('debug')('wxpay');
const request = require('./request');
const utils = require('./utils');

class WXPayError extends Error {
  constructor(message) {
    super(message);
    //this.name = 'WXPayError';
  }
}

class WXPay {
  /**
   * @constructor
   * @param {Object} config 
   * @param {String} config.appid - 公众号appid
   * @param {String} config.mch_id - 商户id
   * @param {String} config.key - 商户支付key
   * @param {String} [config.pfx] - 证书
   * @param {String} [config.notify_url] - 支付后台通知地址
   * @param {String} [config.refund_url] - 退款后台通知地址
   */
  constructor({ appid, mch_id, key, pfx, notify_url, refund_url } = {}) {
    utils.assert(appid, 'appid is not provided');
    utils.assert(mch_id, 'mch_id is not provided');
    utils.assert(key, 'key is not provided');

    this.appid = appid;
    this.mch_id = mch_id;
    this.key = key;
    this.pfx = pfx;
    this.notify_url = notify_url;
    this.refund_url = refund_url;
  }

  /**
   * 生成签名
   * 
   * @param {Object} params 
   * @param {String} type - MD5, HMAC-SHA256
   */
  sign(params, type = 'MD5') {
    const str = utils.querystring(params, ['sign']) + `&key=${this.key}`;
    switch (type) {
      case 'MD5':
        return utils.md5(str).toUpperCase();
      case 'HMAC-SHA256':
        return utils.sha256(str, this.key).toUpperCase();
      default:
        throw new WXPayError('sign type only supports "MD5" and "HMAC-SHA256"');
    }
  }

  /**
   * 解析 xml 数据
   * 
   * @param {String} xml 
   * @param {String} sign_type - 签名方式
   */
  async resolveXMLData(xml, sign_type) {
    // 解析 xml
    const result = await utils.parseXML(xml);
    debug('resolve xml data: %j', result);

    if (result.return_code !== 'SUCCESS') {
      throw new WXPayError(result.return_msg);
    }
    if (result.result_code !== 'SUCCESS') {
      throw new WXPayError(result.err_code_des);
    }

    // 校验签名
    const resultSign = this.sign(result, sign_type);
    debug('check signature: %s %s', resultSign, result.sign);

    if (resultSign !== result.sign) {
      throw new WXPayError('签名校验失败');
    }

    return result;
  }

  /**
   * 发送 http 请求
   * 
   * @param {String} url 
   * @param {Object} params 
   * @param {Boolean} resolve - 是否解析返回结果
   */
  async request(url, params, resolve = true) {
    // 添加签名
    params.sign = this.sign(params, params.sign_type);
    debug('json params: %j', params);

    // 转为 xml
    const xml = utils.buildXML(params);
    debug('xml params: %s', xml);

    const { body } = await request.post(url, { body: xml });
    debug('response: %s', body);

    if (!resolve) return body;
    return await this.resolveXMLData(body, params.sign_type);
  }

  /**
   * 统一下单接口
   * 
   * @param {Object} params 
   */
  unifiedOrder(params) {
    const url = 'https://api.mch.weixin.qq.com/pay/unifiedorder';
    params = Object.assign({
      appid: this.appid,
      mch_id: this.mch_id,
      nonce_str: utils.nonce(),
      sign_type: 'MD5',
      notify_url: this.notify_url,
      spbill_create_ip: '127.0.0.1',
    }, params);
    return this.request(url, params);
  }

  /**
   * 订单查询接口
   * 
   * @param {Object} params 
   */
  queryOrder(params) {
    const url = 'https://api.mch.weixin.qq.com/pay/orderquery';
    params = Object.assign({
      appid: this.appid,
      mch_id: this.mch_id,
      nonce_str: utils.nonce(),
      sign_type: 'MD5',
    }, params);
    return this.request(url, params);
  }

  /**
   * 关闭订单接口
   * 
   * @param {Object} params 
   */
  closeOrder(params) {
    const url = 'https://api.mch.weixin.qq.com/pay/closeorder';
    params = Object.assign({
      appid: this.appid,
      mch_id: this.mch_id,
      nonce_str: utils.nonce(),
      sign_type: 'MD5'
    }, params);
    return this.request(url, params);
  }

  /**
   * 查询退款接口
   * 
   * @param {Object} params 
   */
  queryRefund(params) {
    const url = 'https://api.mch.weixin.qq.com/pay/refundquery';
    params = Object.assign({
      appid: this.appid,
      mch_id: this.mch_id,
      nonce_str: utils.nonce(),
      sign_type: 'MD5',
    }, params);
    return this.request(url, params);
  }

  /**
   * 下载账单
   * 
   * @param {Object} params 
   */
  async downloadBill(params) {
    const url = 'https://api.mch.weixin.qq.com/pay/downloadbill';
    params = Object.assign({
      appid: this.appid,
      mch_id: this.mch_id,
      nonce_str: utils.nonce(),
      sign_type: 'MD5',
      bill_type: 'ALL'
    }, params);

    const data = await this.request(url, params, false);
    // TODO: 完成校验逻辑
    if (utils.isXML(data)) {
      const xml = await utils.parseXML(data);
      throw new WXPayError(xml.return_msg || '下载账单失败');
    }
    return data;
  }

  /**
   * 获取微信h5支付参数
   * 
   * @param {Object} params 
   */
  async getH5PayParams(params) {
    const data = await this.unifiedOrder(params);
    const h5Params = {
      appId: this.appid,
      timeStamp: utils.timestamp(),
      nonceStr: utils.nonce(),
      package: `prepay_id=${data.prepay_id}`,
      signType: params.sign_type || 'MD5',
    };
    h5Params.paySign = this.sign(h5Params, h5Params.signType);
    return h5Params;
  }
}

module.exports = WXPay;