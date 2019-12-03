# WXPay

微信支付工具库

## 安装

```sh
yarn add @lkspc/wxpay
```

## 用法

### 初始化

```js
const WXPay = require('@lkspc/wxpay');

const wxpay = new WXPay(config);
```

### 统一下单

```js
wxpay.unifiedOrder({
  out_trade_no: '201804010000',
  // ...
});
```
