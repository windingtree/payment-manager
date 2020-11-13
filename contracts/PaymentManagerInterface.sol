// SPDX-License-Identifier: GPL-3.0-only;

pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
 *  @title PaymentManagerInterface
 *  @dev ""
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
  function payEth(
    uint256 amountOut,
    uint256 deadline,
    string calldata attachment
  ) external payable;
  function refund(uint256 index, bool refundStableCoin) external;
  function withdraw(uint256 amount, address to) external;
}
