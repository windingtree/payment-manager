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
