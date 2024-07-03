// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import '../src/SutoriPaymaster.sol';

contract Paymaster is Script {
  function deposit() external {
    vm.startBroadcast();

    SutoriPaymaster paymaster = SutoriPaymaster(
      0xB9e5f8ad1A8d925059478260A63F02D001406be5
    );

    paymaster.deposit{ value: 0.01 ether }();

    vm.stopBroadcast();
  }


  function getDeposit() external view {
    SutoriPaymaster paymaster = SutoriPaymaster(
      0xB9e5f8ad1A8d925059478260A63F02D001406be5
    );

    uint256 currentDeposit = paymaster.getDeposit();
    console.log('Deposit:', currentDeposit);
  }
}
