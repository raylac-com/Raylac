// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// !Warning
// !This script doesn't reproduce the deployed contract addresses due to
// !version difference in the dependencies.

import 'forge-std-1.9.3/src/Script.sol';
import '../src/RaylacAccount.sol';
import '../src/AccountFactory.sol';
import '../src/RaylacPaymaster.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import './Utils.s.sol';

contract Deploy is Script, Utils {
  function run() external {
    // uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast();

    // Deploy RaylacAccount

    RaylacAccount raylacAccount;
    address raylacAccountAddress = getAddress(
      type(RaylacAccount).creationCode,
      ''
    );

    if (!isDeployed(raylacAccountAddress)) {
      raylacAccount = new RaylacAccount{ salt: 0 }();
      console.log('RaylacAccount deployed at:', address(raylacAccount));
    } else {
      raylacAccount = RaylacAccount(payable(raylacAccountAddress));
      console.log('RaylacAccount already deployed at:', address(raylacAccount));
    }

    // Deploy AccountFactory

    AccountFactory accountFactory;
    address accountFactoryAddress = getAddress(
      type(AccountFactory).creationCode,
      abi.encode(entryPoint, raylacAccount)
    );

    if (!isDeployed(accountFactoryAddress)) {
      accountFactory = new AccountFactory{ salt: 0 }(entryPoint, raylacAccount);
      console.log('AccountFactory deployed at:', address(accountFactory));
    } else {
      accountFactory = AccountFactory(payable(accountFactoryAddress));
      console.log(
        'AccountFactory already deployed at:',
        address(accountFactory)
      );
    }

    // Deploy RayalcPaymaster

    RaylacPaymaster raylacPaymaster;
    address raylacPaymasterAddress = getAddress(
      type(RaylacPaymaster).creationCode,
      abi.encode(entryPoint, paymasterSigner)
    );

    if (!isDeployed(raylacPaymasterAddress)) {
      raylacPaymaster = new RaylacPaymaster{ salt: 0 }(
        entryPoint,
        paymasterSigner
      );
      console.log('RayalcPaymaster deployed at:', address(raylacPaymaster));
    } else {
      raylacPaymaster = RaylacPaymaster(payable(raylacPaymasterAddress));
      console.log(
        'RayalcPaymaster already deployed at:',
        address(raylacPaymaster)
      );
    }

    vm.stopBroadcast();
  }
}
