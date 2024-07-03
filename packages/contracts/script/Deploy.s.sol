// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import '../src/SutoriAccount.sol';
import '../src/AccountFactory.sol';
import '../src/SutoriPaymaster.sol';
import 'account-abstraction/contracts/samples/SimpleAccount.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import 'openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol';

contract Deploy is Script {
  function run() external {
    //uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast();

    IEntryPoint entryPoint = IEntryPoint(
      0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
    );

    address recoveryPubKey = 0xb3F7dAf94A3816e4b2Cb21fA5622A0DfeEB58E0A;

    SutoriAccount account = new SutoriAccount{ salt: 0 }(entryPoint);

    console.log('SutoriAccount deployed at:', address(account));

    AccountFactory accountFactory = new AccountFactory{ salt: 0 }(
      account,
      recoveryPubKey
    );

    console.log('AccountFactory deployed at:', address(accountFactory));


    address verifyingSigner = 0x94f149b27065aa60ef053788f6B8A60C53C001D4;
    /*
    SutoriPaymaster paymaster = new SutoriPaymaster{ salt: 0 }(
      entryPoint,
      verifyingSigner
    );

    console.log('SutoriPaymaster deployed at:', address(paymaster));
    */

    vm.stopBroadcast();
  }
}
