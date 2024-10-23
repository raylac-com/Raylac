// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { IRaylacAccountV2 } from './IRaylacAccountV2.sol';

contract RaylacStealthTransfer {
  mapping(address => mapping(address => uint256)) public balances;

  constructor() {}

  receive() external payable {}

  struct Input {
    address addr;
    uint256 amount;
  }

  struct Output {
    address addr;
    uint256 amount;
  }

  // How can the user transfer tokens to this contract?
  // When should the user deploy the account contract?

  // 1. When the user wants to transfer tokens to another user

  function transfer(
    address tokenAddress,
    bytes calldata proof,
    Input[] calldata inputs,
    Output[] calldata outputs
  ) public {
    // Check that the sum of the inputs is equal to the sum of the outputs
    uint256 inputSum = 0;
    uint256 outputSum = 0;

    for (uint256 i = 0; i < inputs.length; i++) {
      inputSum += inputs[i].amount;
    }

    for (uint256 i = 0; i < outputs.length; i++) {
      outputSum += outputs[i].amount;
    }

    if (inputSum != outputSum) {
      revert('Input sum does not match output sum');
    }

    for (uint256 i = 0; i < inputs.length; i++) {
      IRaylacAccountV2(inputs[i].addr).stealthTransfer(
        tokenAddress,
        inputs[i].amount
      );
    }

    if (tokenAddress == address(0)) {
      // Native transfer
      for (uint256 i = 0; i < outputs.length; i++) {
        (bool success, ) = payable(outputs[i].addr).call{
          value: outputs[i].amount
        }('');

        if (!success) {
          revert('Native transfer failed');
        }
      }
    } else {
      // ERC20 transfer
      for (uint256 i = 0; i < outputs.length; i++) {
        IERC20(tokenAddress).transfer(outputs[i].addr, outputs[i].amount);
      }
    }
  }
}
