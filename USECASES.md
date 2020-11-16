# PaymentManager use cases

## Actors
- owner
- manager
- payer

## Owner

### As an owner, I want to deploy an upgradeable PaymentManager contract instance

In order to deploy an instance of the PaymentManager we use [smart contract tools](https://github.com/windingtree/smart-contracts-tools).

Deployment command:

```bash
npx tools --network <network> cmd=deploy name=PaymentManager from=<owner_address> initMethod=initialize initArgs=<manager_address>,<uniswap_router_address>,<stablecoin_address>,<wallet_address>
```

Three smart contracts are deployed as a result:

- implementation
- proxy
- proxyadmin

Successful deployment creates a configuration file in `.openzeppelin` directory.

```json
{
  "version": "0.1.3",
  "contract": {
    "name": "PaymentManager",
    "implementation": "0x123bFa1F55e11785e102c7a769F583357d027eFE",
    "proxy": "0x85a51aF0f15c11720c4D31A310bFE78bD6CbaFf9"
  },
  "owner": "0xA0B74BFE28223c9e08d6DBFa74B5bf4Da763f959",
  "proxyAdmin": "0xF59287AD02c59D09CfA0EB96Bc2c7e20a45069F7",
  "blockNumber": 9081917
}
```

Existence of the configuration file is required for the contract upgrade using `smart contract tools`.

### As an owner, I want to upgrade PaymentManager contract instance to it newer version

PaymentManager uses OpenZeppelin's [proxy upgrade pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies).

Upgrade command ([smart contract tools](https://github.com/windingtree/smart-contracts-tools)):

```bash
npx tools --network <network> cmd=upgrade name=PaymentManager from=<owner_address> initMethod=<initializer_name> initArgs=<arg1>,<arg2>,<arg-n>
```

As a result of the successful upgrade, the existing configuration file will be overridden by the new configuration.

## Manager

### As a manager, I want to transfer ownership of the role to another address

- function: `changeManager(address)`
- arguments:
  - `address`: An address of the new manager

The function call is restricted to be used by the manager only.

### As a manager, I want to change Uniswap router address stored in the PaymentManager contract

- function: `changeUniswap(address)`
- arguments:
  - `address`: An address of the Uniswap router

The function call is restricted to be used by the manager only.

### As a manager, I want to change wallet address stored in the PaymentManager contract

- function: `changeWallet(address)`
- arguments:
  - `address`: An address of the new wallet

The function call is restricted to be used by the manager only.

### As a manager, I want to know when a new payment is made via the PaymentManager

When payment is made the `Paid` event is emitted. Listening to this event allow to catch new payments by the manager.

- event: `Paid`
- arguments:
  - `uint256`: Index of the payment

### As a manager, I want to get payment information by its index

- function: `payments(uint256)`
- arguments:
  - `uint256`: Index of the payment

The data returned with the function call represents the payment structure:

- `status`(`uint256`): The payment status. `0` - paid, `1` - refunded
- `tokenIn`(`address`): Address of the token paid by payer (WETH address in case of native ETH)
- `amountIn`(`uint256`): Amount paid by the payer in tokens
- `tokenOut`(`address`): Address of the target token (actually it is a stableCoin)
- `amountOut`(`uint256`): Amount paid by the payer in target tokens
- `payer`(`address`): Address of the payer
- `isEther`(`bool`): Is payer has paid with ETH
- `attachment`(`string`): Textual attachment (eq: offerId, orderId, or URI)

### As a manager, I want to refund payment made via the PaymentManager

- function: `refund(uint256,bool)`
- arguments:
  - `uint256`: The index of the payment
  - `bool`: The flag that allows making a refund in stablecoin instead of the token has used by the payer for payment

To be able to make refund manager have to transfer stablecoinn tokens in an amount of the funds dedicated to refund to the PaymentManager contract address.

When stablecoin tokens sent the manager should call `refund` function to make a refund.

If `bool` argument of the `refund` function has been set to the `true` value then stablecoin tokens will be sent to the payer directly without conversion to the initial asset had used by the payer.

Otherwise, stablecoin tokens will be converted to the tokens (or native ETH) had used by the payer for payment and sent to him.

The payment cannot be refunded twice.

The function call is restricted to be used by the manager only.

## Payer

### As a payer, I want to know how much tokens should be used to make a payment

- function: `getAmountIn(uint256,address)`
- arguments:
  - `uint256`: The amount of stablecoin to be paid
  - `address`: An address of the payers token

This function is using a token conversion feature of the Uniswap router contract. The Uniswap contract calculates tokens conversions quotes on the base of the state of tokens liquidity pools. Each time `getAmountIn` function called the amount can change due to liquidity pools mutability.

### As a payer, I want to make a payment using ERC20 token

- function: `pay(uint256,uint256,address,uint256,string)`
- arguments:
  - `uint256`: The amount of stablecoin to be paid
  - `uint256`: The amount of payers tokens that should be used for payment
  - `address`: An address of the payers token
  - `uint256`: The deadline. The time after which a transaction will be reverted
  - `string`: Textual attachment to the payment

Before the call of this function, the payer has to approve spending of his tokens for the PaymentManage contract.

The function call will be reverted in the following cases:
- If payers tokens not approved
- If the estimation of the amount of payer tokens that should be used for payment is changed and became greater than sent in the second parameter
- If the transfer of payer tokens has failed

During the payment, tokens conversion quote can be changed in a negative direction. In that case, the rest of the tokens after conversion will be sent to the payer.

If payment made with stablecoin tokens then these tokens will be sent without the Uniswap usage.

### As a payer, I want to make a payment using ETH

- function: `payETH(uint256,uint256,string)`
- arguments:
  - `uint256`: The amount of stablecoin to be paid
  - `uint256`: The deadline. The time after which a transaction will be reverted
  - `string`: Textual attachment to the payment

This function behaviour is the same as at a `pay` function.

### As a payer, I want to get payment information by its index

See the same case for `manager` role.
