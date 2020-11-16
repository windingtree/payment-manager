![Unit tests](https://github.com/windingtree/payment-manager/workflows/Unit%20tests/badge.svg) [![Coverage Status](https://coveralls.io/repos/github/windingtree/payment-manager/badge.svg?branch=main)](https://coveralls.io/github/windingtree/payment-manager?branch=main) ![Node.js Package](https://github.com/windingtree/payment-manager/workflows/Node.js%20Package/badge.svg)

# payment-manager
Smart contract for managing of crypto payments

## Use cases

See use cases description and implementation in terms of the PaymentManager smart contract [here](./USECASES.md).

## Contract ABI

Install the package:

```bash
$ npm i @windingtree/payment-manager
```

Import ABI in the your JavaScript code:

```javascript
const {
  PaymentManagerContract,
  PaymentManagerInterfaceContract,
  addresses
} = require('@windingtree/payment-manager');

// PaymentManagerContract.abi <-- ABI
// addresses.PaymentManager.ropsten <-- Address of the deployed PaymentManager
```
