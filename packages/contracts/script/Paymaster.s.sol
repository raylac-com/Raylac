// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std-1.9.3/src/Script.sol';
import '../src/RaylacPaymaster.sol';
import './Utils.s.sol';

contract Paymaster is Script, Utils {
  function getPaymaster() public view returns (RaylacPaymaster) {
    address paymasterAddress = getAddress(
      type(RaylacPaymaster).creationCode,
      abi.encode(entryPoint, paymasterSigner)
    );

    require(isDeployed(paymasterAddress), 'Paymaster not deployed');

    return RaylacPaymaster(payable(paymasterAddress));
  }

  function deposit() external {
    vm.startBroadcast();

    RaylacPaymaster raylacPaymaster = getPaymaster();
    raylacPaymaster.deposit{ value: 0.02 ether }();

    vm.stopBroadcast();
  }

  function getDeposit() external view {
    RaylacPaymaster raylacPaymaster = RaylacPaymaster(
      0xCa7bEdEcCd6FBD68d0043bb4c4B2405B4948BC8c
    );
    uint256 currentDeposit = raylacPaymaster.getDeposit();
    console.log('Verifying Signer:', raylacPaymaster.verifyingSigner());
    console.log('Deposit:', currentDeposit);
  }
}
