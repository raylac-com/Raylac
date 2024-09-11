// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import '../src/RaylacPaymaster.sol';
import './Utils.s.sol';

contract Paymaster is Script, Utils {
  function getPaymaster() public view returns (RaylacPaymaster) {
    address paymasterAddress = getDeployedAddress(
      type(RaylacPaymaster).creationCode,
      abi.encode(entryPoint, paymasterSigner)
    );

    require(paymasterAddress != address(0), 'Paymaster not deployed');

    return RaylacPaymaster(payable(paymasterAddress));
  }

  function deposit() external {
    vm.startBroadcast();

    RaylacPaymaster raylacPaymaster = getPaymaster();
    raylacPaymaster.deposit{ value: 0.02 ether }();

    vm.stopBroadcast();
  }

  function getDeposit() external view {
    RaylacPaymaster raylacPaymaster = getPaymaster();
    uint256 currentDeposit = raylacPaymaster.getDeposit();
    console.log('Deposit:', currentDeposit);
  }
}
