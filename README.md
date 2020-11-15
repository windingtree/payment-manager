# payment-manager
Smart contract for managing of crypto payments

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
