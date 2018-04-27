# WXPay

微信支付工具库

## 用法

### 初始化

```js
const wxpay = require('wxpay')(config);
```

### 统一下单

```js
wxpay.unifiedOrder({
  out_trade_no: '201804010000',
  // ...
});
```