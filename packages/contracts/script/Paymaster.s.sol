// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import '../src/SutoriPaymaster.sol';
import './Utils.s.sol';

contract Paymaster is Script, Utils {
  function getPaymaster() public view returns (SutoriPaymaster) {
    address paymasterAddress = getDeployedAddress(
      type(SutoriPaymaster).creationCode,
      abi.encode(entryPoint, paymasterSigner)
    );
    require(paymasterAddress != address(0), 'Paymaster not deployed');

    return SutoriPaymaster(payable(paymasterAddress));
  }

  function deposit() external {
    vm.startBroadcast();

    SutoriPaymaster sutoriPaymaster = getPaymaster();
    sutoriPaymaster.deposit{ value: 0.02 ether }();

    vm.stopBroadcast();
  }

  function getDeposit() external view {
    SutoriPaymaster sutoriPaymaster = getPaymaster();
    uint256 currentDeposit = sutoriPaymaster.getDeposit();
    console.log('Deposit:', currentDeposit);
  }
}
