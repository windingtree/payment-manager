// SPDX-License-Identifier: GPL-3.0-only;

pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 *  @title PaymentManagerInterface
 *  @dev Interface for the PaymentManager contract
 */
interface PaymentManagerInterface {
  function getAmountIn(
    uint256 amountOut,
    address tokenIn
  ) external view returns (uint256 amount);
  function pay(
    uint256 amountOut,
    uint256 amountIn,
    IERC20 tokenIn,
    uint256 deadline,
    string calldata attachment
  ) external;
  function payETH(
    uint256 amountOut,
    uint256 deadline,
    string calldata attachment
  ) external payable;
  function refund(uint256 index, bool refundStableCoin) external;
  function getPaymentsCount() external view returns (uint256);
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
}
