// SPDX-License-Identifier: GPL-3.0-only;

pragma solidity 0.6.6;

import "./PaymentManagerInterface.sol";
import "@windingtree/smart-contracts-libraries/contracts/ERC165/ERC165Removable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";


/**
 * @title PaymentManager
 * @dev Payment manager class.
 * Allowing pay in tokens which will be automatically converted
 * to the pre-defined stable coin using Uniswap exchange
 */
contract PaymentManager is PaymentManagerInterface, ERC165Removable, Ownable, Initializable {

  enum Status {
    Paid,
    Refunded
  }

  struct Payment {
    Status status;
    address tokenIn; // Address of the token paid by payer (WETH address in case of native ETH)
    uint256 amountIn; // Amount paid by the payer in tokens
    address tokenOut; // Address of the target token (actually it is a stableCoin)
    uint256 amountOut; // Amount paid by the payer in target tokens
    address payer; // Address of the payer
    bool isEther; // Is payer has paid with ETH
    string attachment; // Textual attachment (eq: offerId, orderId, or URI)
  }

  IUniswapV2Router02 public uniswap; // Uniswap instance
  IERC20 public stableCoin; // Stable coin instance
  Payment[] public payments; // All payments list
  mapping(address => uint256[]) public payerPayments; // Mapping of the payer address to his payments

  /**
   * @dev The event triggered when payment is done
   * @param index Payment index
   */
  event Paid(uint256 index);

  /**
   * @dev The event triggered when payment is refunded
   * @param index Payment index
   */
  event Refunded(uint256 index);

  /**
   *  @dev Initializer for upgradeable contracts.
   *  @param _owner The trusted owner of this contract.
   */
  function initialize(
    address _owner,
    IUniswapV2Router02 _uniswap,
    IERC20 _stableCoin
  ) public initializer {
    _setInterfaces();
    transferOwnership(_owner);
    uniswap = _uniswap;
    stableCoin = _stableCoin;
  }

  /**
   * @dev Calculates the required amount of tokens to be paid
   * @param amountOut Amount to be paid in stable coins
   * @param tokenIn The token provided by the payer
   * @return amount Amount of payers tokens that should be provided for payment
   */
  function getAmountIn(
    uint256 amountOut,
    address tokenIn
  ) public view virtual override returns (uint256 amount) {
    address[] memory path = _buildPath(tokenIn, address(stableCoin));
    amount = uniswap.getAmountsIn(amountOut, path)[0];
  }

  /**
   * @dev Make payment with tokens
   * @param amountOut Amount to be paid in stable coins
   * @param amountIn Amount to pay in payer tokens
   * @param tokenIn The token provided by the payer
   * @param deadline Time after which transaction will be reverted if not succeeded
   * @param attachment Textual attachment to the payment
   */
  function pay(
    uint256 amountOut,
    uint256 amountIn,
    IERC20 tokenIn,
    uint256 deadline,
    string calldata attachment
  ) external virtual override {
    require(
      tokenIn.allowance(msg.sender, address(uniswap)) >= amountIn,
      "PM: Tokens not approved"
    );
    require(
      getAmountIn(amountOut, address(tokenIn)) <= amountIn,
      "PM: Estimation has increased"
    );

    _registerPayment(
      address(tokenIn),
      amountIn,
      amountOut,
      false,
      attachment
    );

    uniswap.swapTokensForExactTokens(
      amountOut,
      amountIn,
      _buildPath(address(tokenIn), address(stableCoin)),
      address(this),
      deadline
    );
  }

  /**
   * @dev Make payment with Ether
   * @param amountOut Amount to be paid in stable coins
   * @param deadline Time after which transaction will be reverted if not succeeded
   * @param attachment Textual attachment to the payment
   */
  function payEth(
    uint256 amountOut,
    uint256 deadline,
    string calldata attachment
  ) external virtual override payable {
    address weth = uniswap.WETH();

    require(
      getAmountIn(amountOut, weth) <= msg.value,
      "PM: Estimation has increased"
    );

    _registerPayment(
      weth,
      msg.value,
      amountOut,
      true,
      attachment
    );

    uniswap.swapETHForExactTokens(
      amountOut,
      _buildPath(weth, address(stableCoin)),
      address(this),
      deadline
    );
  }

  /**
   * @dev Make payment refund
   * @param index Index of the payment
   * @param refundStableCoin A flag which allows refunding in stable coins
   */
  function refund(
    uint256 index,
    bool refundStableCoin
  ) external virtual override onlyOwner {
    Payment storage payment = payments[index];

    require(
      payment.payer != address(0),
      "PM: Payment not found"
    );
    require(
      payment.status != Status.Refunded,
      "PM: Payment has already been refunded"
    );

    payment.status = Status.Refunded;
    emit Refunded(index);

    if (refundStableCoin) {
      require(
        stableCoin.transfer(payment.payer, payment.amountOut),
        "PM: Unable to transfer refunded funds"
      );
    } else {
      address[] memory path = _buildPath(payment.tokenOut, payment.tokenIn);
      uint256 refundAmountMin = uniswap.getAmountsOut(
        payment.amountOut,
        path
      )[path.length - 1]; // The last path position
      uint256 deadline = block.timestamp + 43200; // @todo How to calculate this deadline? Currently just adds 12 hours

      if (payment.isEther) {
        uniswap.swapExactTokensForETH(
          payment.amountOut,
          refundAmountMin,
          path,
          payment.payer,
          deadline
        );
      } else {
        uniswap.swapExactTokensForTokens(
          payment.amountOut,
          refundAmountMin,
          path,
          payment.payer,
          deadline
        );
      }
    }
  }

  /**
   * @dev Make funds withdrawal
   * @param amount Amount of stable coins to withdraw
   * @param to Recipient address
   */
  function withdraw(
    uint256 amount,
    address to
  ) external virtual override onlyOwner {
    require(
      stableCoin.balanceOf(address(this)) >= amount,
      "PM: Insufficient funds"
    );
    require(
      stableCoin.transfer(to, amount),
      "PM: Unable to transfer withdrawn funds"
    );
  }

  /**
   * @dev Registering of payment and emits an event
   * @param tokenIn An address of the token to start from
   * @param amountIn Amount of payers tokens
   * @param amountOut Amount of stable coins to be paid
   * @param isEther Is payer pays by the Ether
   * @param attachment Textual attachment to the payment
   */
  function _registerPayment(
    address tokenIn,
    uint256 amountIn,
    uint256 amountOut,
    bool isEther,
    string memory attachment
  ) internal {
    emit Paid(payments.length);
    payerPayments[msg.sender].push(payments.length);
    payments.push(Payment(
      Status.Paid,
      tokenIn,
      amountIn,
      address(stableCoin),
      amountOut,
      msg.sender,
      isEther,
      attachment
    ));
  }

  /**
   * @dev Building an exchange path
   * @param tokenIn An address of the token to start from
   * @param tokenOut An address of the target token
   * @return path Exchange path
   */
  function _buildPath(
    address tokenIn,
    address tokenOut
  ) internal view returns (address[] memory path) {
    address weth = uniswap.WETH();
    path = new address[](tokenIn == weth ? 2 : 3);

    if (tokenIn == weth) {
      path[0] = tokenIn;
      path[1] = tokenOut;
    } else {
      path[0] = weth;
      path[1] = tokenIn;
      path[2] = tokenOut;
    }
  }

  /**
   * @dev Set the list of contract interfaces supported
   */
  function _setInterfaces() internal {
    PaymentManagerInterface p;
    bytes4[1] memory interfaceIds = [
      // payment interface:
      p.getAmountIn.selector ^
      p.pay.selector ^
      p.payEth.selector
    ];

    for (uint256 i = 0; i < interfaceIds.length; i++) {
      _registerInterface(interfaceIds[i]);
    }
  }
}
