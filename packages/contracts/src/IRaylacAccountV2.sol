// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IRaylacAccountV2 {
  function execute(
    address dest,
    uint256 value,
    bytes calldata func,
    bytes calldata /* tag */
  ) external;

  function stealthTransfer(address tokenAddress, uint256 amount) external;
}
