'use strict';

const { parseString, Builder } = require('xml2js');
const crypto = require('crypto');

/**
 * assert
 * 
 * @param {Boolean} exp 
 * @param {String} message 
 */
exports.assert = function(exp, message) {
  if (!exp) throw new Error(message);
};

/**
 * convert object to query string without ignored keys and nullable values
 * 
 * @param {Object} obj 
 * @param {Array} ignoredKeys 
 */
exports.querystring = function(obj, ignoredKeys) {
  const ignoredValues = [undefined, null, ''];
  return Object.keys(obj)
    .filter(key => !ignoredKeys.includes(key) && !ignoredValues.includes(obj[key]))
    .sort()
    .map(key => `${key}=${obj[key]}`)
    .join('&');
};

/**
 * generate nonce string with specified length
 * 
 * @param {Number} [len=16]
 */
exports.nonce = function(len = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const max = chars.length;

  let str = '';
  for (let i = 0; i < len; ++i) {
    str += chars[~~(Math.random() * max)];
  }
  return str;
};

/**
 * generate second-level timestamp string
 */
exports.timestamp = function() {
  return Number.parseInt(Date.now() / 1000, 10).toString();
};

/**
 * md5 
 * 
 * @param {String} str 
 * @param {String} [encoding='utf8']
 */
exports.md5 = function(str, encoding = 'utf8') {
  return crypto.createHash('md5').update(str, encoding).digest('hex');
};

/**
 * hmac-sha256
 * 
 * @param {String} str 
 * @param {String} key 
 * @param {String} [encoding='utf8']
 */
exports.sha256 = function(str, key, encoding = 'utf8') {
  return crypto.createHmac('sha256', key).update(str, encoding).digest('hex');
};

/**
 * check if a string is XML
 * 
 * @param {String} str 
 */
exports.isXML = function(str) {
  return /^\s*<[\s\S]*>/.test(str);
};

/**
 * parse xml string to JSON object
 * 
 * @param {String} xml 
 */
exports.parseXML = function(xml) {
  return new Promise((resolve, reject) => {
    const opts = { trim: true, explicitArray: false, explicitRoot: false };
    parseString(xml, opts, (err, result) => {
      if (err) {
        err.name = 'XMLParseError';
        return reject(err);
      }
      return resolve(result || {});
    });
  });
};

/**
 * build xml string from JSON object
 * 
 * @param {Object} obj 
 */
exports.buildXML = function(obj) {
  const opts = { rootName: 'xml', headless: true, allowSurrogateChars: true, cdata: true };
  return new Builder(opts).buildObject(obj);
};