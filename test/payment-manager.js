const {
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');
const {
  setupWeth,
  setupTokens
} = require('./utils/tokens');
const {
  setupUniswap
} = require('./utils/uniswap-factory');
const {
  setupOrgId,
  generateHashHelper
} = require('./utils/orgId');
const PaymentManager = artifacts.require('PaymentManager');

require('chai')
  .use(require('bn-chai')(web3.utils.BN))
  .should();
const BN = web3.utils.toBN;

contract('PaymentManager', accounts => {
  const Status = {
    Paid: 0,
    Refunded: 1
  };
  const [
    tokensOwner,
    uniswapOwner,
    pmOwner,
    managerWallet,
    orgIdOwner,
    payer
  ] =  accounts;
  let weth;
  let tokens;
  let uniswap;
  let orgId;
  let pm;

  before(async () => {
    weth = await setupWeth(tokensOwner);
    tokens = await setupTokens(
      [
        {
          symbol: 'USDC',
          decimals: 6,
          supply: '1000000000000'
        },
        {
          symbol: 'LIF',
          decimals: 18,
          supply: '1000000000000000000000000'
        }
      ],
      tokensOwner
    );
    await tokens.USDC.transfer(payer, '1000000000', { from: tokensOwner });
    await tokens.LIF.transfer(payer, '1000000000000000000000', { from: tokensOwner });

    uniswap = await setupUniswap(
      weth.address,
      uniswapOwner
    );

    const amountTokenDesired = '1000000000'; // 1000 USDC
    const amountTokenMin = amountTokenDesired;
    const amountTokenDesiredLIF = '10000000000000000000'; // 1 LIF
    const amountTokenMinLIF = amountTokenDesiredLIF;
    const amountETHMin = '10000000000000000000'; // 10 ETH

    await tokens.USDC.approve(
      uniswap.router.address,
      amountTokenDesired,
      {
        from: tokensOwner
      }
    );
    await tokens.LIF.approve(
      uniswap.router.address,
      amountTokenDesiredLIF,
      {
        from: tokensOwner
      }
    );

    await uniswap.router.addLiquidityETH(
      tokens.USDC.address,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      uniswapOwner,
      Math.floor(Date.now() / 1000) + 300,
      {
        from: tokensOwner,
        value: amountETHMin
      }
    );
    await uniswap.router.addLiquidityETH(
      tokens.LIF.address,
      amountTokenDesiredLIF,
      amountTokenMinLIF,
      amountETHMin,
      uniswapOwner,
      Math.floor(Date.now() / 1000) + 300,
      {
        from: tokensOwner,
        value: amountETHMin
      }
    );

    orgId = await setupOrgId(orgIdOwner);

    pm = await PaymentManager.new({
      from: pmOwner
    });
    await pm.initialize(
      pmOwner,
      uniswap.router.address,
      tokens.USDC.address,
      managerWallet,
      orgId.address,
      {
        from: pmOwner
      }
    );
  });

  describe('#changeOrgId(address)', () => {
    let initialValue;
    const newValue = constants.ZERO_ADDRESS;
    before(async () => {
      initialValue = await pm.orgId();
    });
    after(async () => {
      await pm.changeOrgId(
        initialValue,
        {
          from: pmOwner
        }
      );
    });

    it('should fail if called by wrong account', async () => {
      await expectRevert(
        pm.changeOrgId(
          newValue,
          {
            from: payer
          }
        ),
        'PM: Caller is not the manager'
      );
    });

    it('should change value', async () => {
      await pm.changeOrgId(
        newValue,
        {
          from: pmOwner
        }
      );
      (await pm.orgId()).should.equal(newValue);
    });
  });

  describe('#changeManager(address)', () => {
    let initialValue;
    const newValue = payer;
    before(async () => {
      initialValue = await pm.manager();
    });
    after(async () => {
      await pm.changeManager(
        initialValue,
        {
          from: newValue
        }
      );
    });

    it('should fail if called by wrong account', async () => {
      await expectRevert(
        pm.changeManager(
          newValue,
          {
            from: payer
          }
        ),
        'PM: Caller is not the manager'
      );
    });

    it('should change value', async () => {
      await pm.changeManager(
        newValue,
        {
          from: pmOwner
        }
      );
      (await pm.manager()).should.equal(newValue);
    });
  });

  describe('#changeUniswap(address)', () => {
    let initialValue;
    const newValue = constants.ZERO_ADDRESS;
    before(async () => {
      initialValue = await pm.uniswap();
    });
    after(async () => {
      await pm.changeUniswap(
        initialValue,
        {
          from: pmOwner
        }
      );
    });

    it('should fail if called by wrong account', async () => {
      await expectRevert(
        pm.changeUniswap(
          newValue,
          {
            from: payer
          }
        ),
        'PM: Caller is not the manager'
      );
    });

    it('should change value', async () => {
      await pm.changeUniswap(
        newValue,
        {
          from: pmOwner
        }
      );
      (await pm.uniswap()).should.equal(newValue);
    });
  });

  describe('#changeWallet(address)', () => {
    let initialValue;
    const newValue = constants.ZERO_ADDRESS;
    before(async () => {
      initialValue = await pm.wallet();
    });
    after(async () => {
      await pm.changeWallet(
        initialValue,
        {
          from: pmOwner
        }
      );
    });

    it('should fail if called by wrong account', async () => {
      await expectRevert(
        pm.changeWallet(
          newValue,
          {
            from: payer
          }
        ),
        'PM: Caller is not the manager'
      );
    });

    it('should change value', async () => {
      await pm.changeWallet(
        newValue,
        {
          from: pmOwner
        }
      );
      (await pm.wallet()).should.equal(newValue);
    });
  });

  describe('#getAmountIn(uint256,address)', () => {
    const amountUSDC = '100000000'; // 100 USD

    it('should return amount of tokens for the payment', async () => {
      const amountIn = await pm.getAmountIn(amountUSDC, tokens.LIF.address);
      (amountIn.toString()).should.not.equal('0');
    });
  });

  describe('#pay(uint256,uint256,address,uint256,string)', () => {
    const amountUSDC = '100000000'; // 100 USD
    const attachment = 'payment#1';

    it('should fail if tokens not approved', async () => {
      const amountIn = await pm.getAmountIn(amountUSDC, tokens.LIF.address);
      await expectRevert(
        pm.pay(
          amountUSDC,
          amountIn,
          tokens.LIF.address,
          Math.ceil(Date.now() / 1000) + 300,
          attachment,
          orgId.organizations[0],
          {
            from: payer
          }
        ),
        'PM: Tokens not approved'
      );
    });

    it('should make a payment with token', async () => {
      const amountIn = await pm.getAmountIn(amountUSDC, tokens.LIF.address);
      const managerBalanceBefore = await tokens.USDC.balanceOf(managerWallet);
      await tokens.LIF.approve(pm.address, amountIn, { from: payer });
      const paymentIndex = await pm.getPaymentsCount();

      await expectRevert(
        pm.pay(
          amountUSDC,
          amountIn,
          tokens.LIF.address,
          Math.ceil(Date.now() / 1000) + 300,
          attachment,
          orgId.organizations[1],
          {
            from: payer
          }
        ),
        'PM: Merchant organization not exists or disabled'
      );

      const receipt = await pm.pay(
        amountUSDC,
        amountIn,
        tokens.LIF.address,
        Math.ceil(Date.now() / 1000) + 300,
        attachment,
        orgId.organizations[0],
        {
          from: payer
        }
      );

      expectEvent(
        receipt,
        'Paid',
        {
          index: paymentIndex
        }
      );

      const managerBalanceAfter = await tokens.USDC.balanceOf(managerWallet);
      (
        managerBalanceAfter.sub(managerBalanceBefore)
      ).should.to.eq.BN(amountUSDC);

      const payment = await pm.payments(paymentIndex);
      (payment.status).should.to.eq.BN(Status.Paid);
      (payment.tokenIn).should.equal(tokens.LIF.address);
      (payment.amountIn).should.to.eq.BN(amountIn);
      (payment.tokenOut).should.equal(tokens.USDC.address);
      (payment.amountOut).should.to.eq.BN(amountUSDC);
      (payment.payer).should.equal(payer);
      (payment.isEther).should.be.false;
      (payment.attachment).should.equal(attachment);
      (payment.merchant).should.equal(orgId.organizations[0]);
    });

    it('should make a payment with stablecoin', async () => {
      await tokens.USDC.approve(pm.address, amountUSDC, { from: payer });
      const paymentIndex = await pm.getPaymentsCount();

      const receipt = await pm.pay(
        amountUSDC,
        amountUSDC,
        tokens.USDC.address,
        Math.ceil(Date.now() / 1000) + 300,
        attachment,
        orgId.organizations[0],
        {
          from: payer
        }
      );

      expectEvent(
        receipt,
        'Paid',
        {
          index: paymentIndex
        }
      );
    });
  });

  describe('#payETH(uint256,uint256,string)', () => {
    const amountUSDC = '100000000'; // 100 USD
    const attachment = 'payment#1';

    it('should make payment with ETH', async () => {
      const amountIn = await pm.getAmountIn(amountUSDC, weth.address);
      const managerBalanceBefore = await tokens.USDC.balanceOf(managerWallet);
      const paymentIndex = await pm.getPaymentsCount();

      await expectRevert(
        pm.payETH(
          amountUSDC,
          Math.ceil(Date.now() / 1000) + 300,
          attachment,
          orgId.organizations[1],
          {
            from: payer,
            value: amountIn
          }
        ),
        'PM: Merchant organization not exists or disabled'
      );

      const receipt = await pm.payETH(
        amountUSDC,
        Math.ceil(Date.now() / 1000) + 300,
        attachment,
        orgId.organizations[0],
        {
          from: payer,
          value: amountIn
        }
      );

      expectEvent(
        receipt,
        'Paid',
        {
          index: paymentIndex
        }
      );

      const managerBalanceAfter = await tokens.USDC.balanceOf(managerWallet);
      (
        managerBalanceAfter.sub(managerBalanceBefore)
      ).should.to.eq.BN(amountUSDC);

      const payment = await pm.payments(paymentIndex);
      (payment.status).should.to.eq.BN(Status.Paid);
      (payment.tokenIn).should.equal(weth.address);
      (payment.amountIn).should.to.eq.BN(amountIn);
      (payment.tokenOut).should.equal(tokens.USDC.address);
      (payment.amountOut).should.to.eq.BN(amountUSDC);
      (payment.payer).should.equal(payer);
      (payment.isEther).should.be.true;
      (payment.attachment).should.equal(attachment);
      (payment.merchant).should.equal(orgId.organizations[0]);
    });
  });

  describe('#refund(uint256,bool)', () => {
    const amountUSDC = '100000000'; // 100 USD
    const attachment = 'payment#1';

    it('should refund payment made with token', async () => {
      const amountIn = await pm.getAmountIn(amountUSDC, tokens.LIF.address);
      await tokens.LIF.approve(pm.address, amountIn, { from: payer });

      const receipt = await pm.pay(
        amountUSDC,
        amountIn,
        tokens.LIF.address,
        Math.ceil(Date.now() / 1000) + 300,
        attachment,
        orgId.organizations[0],
        {
          from: payer
        }
      );

      const payerBalanceBefore = await tokens.LIF.balanceOf(payer);
      const paymentIndex = receipt.logs[0].args.index;
      const payment = await pm.payments(paymentIndex);
      const refundAmountMin = (await uniswap.router.getAmountsOut(
        payment.amountOut,
        [
          payment.tokenOut,
          weth.address,
          payment.tokenIn
        ]
      ))[2];

      // First time send less when required
      await tokens.USDC.transfer(
        pm.address,
        payment.amountOut.sub(BN(10)),
        {
          from: managerWallet
        }
      );

      await expectRevert(
        pm.refund(
          paymentIndex,
          false,
          {
            from: pmOwner
          }
        ),
        'PM: Insufficient funds'
      );

      // Send the rest of funds
      await tokens.USDC.transfer(
        pm.address,
        BN(10),
        {
          from: managerWallet
        }
      );

      const refundReceipt = await pm.refund(
        paymentIndex,
        false,
        {
          from: pmOwner
        }
      );

      expectEvent(
        refundReceipt,
        'Refunded',
        {
          index: paymentIndex
        }
      );

      const payerBalanceAfter = await tokens.LIF.balanceOf(payer);
      (
        payerBalanceAfter.sub(payerBalanceBefore)
      ).should.to.gte.BN(refundAmountMin);

      const refundedPayment = await pm.payments(paymentIndex);
      (refundedPayment.status).should.to.eq.BN(Status.Refunded);

      await expectRevert(
        pm.refund(
          paymentIndex,
          false,
          {
            from: pmOwner
          }
        ),
        'PM: Payment has already been refunded'
      );
    });

    it('should refund payment made with ETH', async () => {
      const amountIn = await pm.getAmountIn(amountUSDC, weth.address);
      const receipt = await pm.payETH(
        amountUSDC,
        Math.ceil(Date.now() / 1000) + 300,
        attachment,
        orgId.organizations[0],
        {
          from: payer,
          value: amountIn
        }
      );
      const paymentIndex = receipt.logs[0].args.index;
      const payerBalanceBefore = await web3.eth.getBalance(payer);
      const payment = await pm.payments(paymentIndex);
      const refundAmountMin = (await uniswap.router.getAmountsOut(
        payment.amountOut,
        [
          payment.tokenOut,
          weth.address
        ]
      ))[1];
      await tokens.USDC.transfer(
        pm.address,
        payment.amountOut,
        {
          from: managerWallet
        }
      );

      const refundReceipt = await pm.refund(
        paymentIndex,
        false,
        {
          from: pmOwner
        }
      );

      expectEvent(
        refundReceipt,
        'Refunded',
        {
          index: paymentIndex
        }
      );

      const payerBalanceAfter = await web3.eth.getBalance(payer);
      (
        payerBalanceAfter.sub(payerBalanceBefore)
      ).should.to.gte.BN(refundAmountMin);

      const refundedPayment = await pm.payments(paymentIndex);
      (refundedPayment.status).should.to.eq.BN(Status.Refunded);

      await expectRevert(
        pm.refund(
          paymentIndex,
          false,
          {
            from: pmOwner
          }
        ),
        'PM: Payment has already been refunded'
      );
    });

    it('should refund stablecoin tokens if payment has been made with stablecoin', async () => {
      await tokens.USDC.approve(pm.address, amountUSDC, { from: payer });
      const receipt = await pm.pay(
        amountUSDC,
        amountUSDC,
        tokens.USDC.address,
        Math.ceil(Date.now() / 1000) + 300,
        attachment,
        orgId.organizations[0],
        {
          from: payer
        }
      );
      const paymentIndex = receipt.logs[0].args.index;

      await tokens.USDC.transfer(
        pm.address,
        amountUSDC,
        {
          from: managerWallet
        }
      );

      const refundReceipt = await pm.refund(
        paymentIndex,
        false,
        {
          from: pmOwner
        }
      );

      expectEvent(
        refundReceipt,
        'Refunded',
        {
          index: paymentIndex
        }
      );
    });
  });
});
