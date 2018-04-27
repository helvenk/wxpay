'use strict';

const http = require('http');
const https = require('https');
const URL = require('url');
const debug = require('debug')('WXPay:request');

function request(url, opts) {
  const urlObj = URL.parse(url);
  const _request = urlObj.protocol === 'http:' ? http.request : https.request;
  return new Promise((resolve, reject) => {
    const _opts = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      method: opts.method || 'GET',
      path: urlObj.path,
      headers: opts.headers || {},
      auth: opts.auth,
      timeout: opts.timeout,
    };

    debug('%s %s', _opts.method, url);
    const req = _request(_opts, (res) => {
      res.setEncoding('utf8');
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        res.body = res.data = raw;
        resolve(res);
      });
    });

    req.on('error', e => reject);
    if (['POST', 'PUT'].includes(opts.method)) {
      req.write(JSON.stringify(opts.data || opts.body || {}));
    }
    req.end();
  });
}

request.post = function(url, opts = {}) {
  opts.method = 'POST';
  return request(url, opts);
};

request.get = function(url, opts = {}) {
  opts.method = 'POST';
  return request(url, opts);
};

module.exports = request;