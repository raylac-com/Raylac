// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import '../src/RaylacAccount.sol';
import '../src/AccountFactory.sol';
import '../src/RaylacPaymaster.sol';
import 'account-abstraction/contracts/samples/SimpleAccount.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import 'openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import './Utils.s.sol';

contract Deploy is Script, Utils {
  function run() external {
    // uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast();

    // Deploy RaylacAccount

    RaylacAccount raylacAccount;
    address raylacAccountAddress = getDeployedAddress(
      type(RaylacAccount).creationCode,
      ''
    );

    if (raylacAccountAddress == address(0)) {
      raylacAccount = new RaylacAccount{ salt: 0 }();
      console.log('RaylacAccount deployed at:', address(raylacAccount));
    } else {
      raylacAccount = RaylacAccount(payable(raylacAccountAddress));
      console.log('RaylacAccount already deployed at:', address(raylacAccount));
    }

    // Deploy AccountFactory

    AccountFactory accountFactory;
    address accountFactoryAddress = getDeployedAddress(
      type(AccountFactory).creationCode,
      abi.encode(entryPoint, raylacAccount)
    );

    if (accountFactoryAddress == address(0)) {
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
    address raylacPaymasterAddress = getDeployedAddress(
      type(RaylacPaymaster).creationCode,
      abi.encode(entryPoint, paymasterSigner)
    );

    if (raylacPaymasterAddress == address(0)) {
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
