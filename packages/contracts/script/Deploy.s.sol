// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import '../src/SutoriAccount.sol';
import '../src/AccountFactory.sol';
import '../src/SutoriPaymaster.sol';
import 'account-abstraction/contracts/samples/SimpleAccount.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import 'openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import './Utils.s.sol';

contract Deploy is Script, Utils {
  function run() external {
    // uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast();

    address recoveryGuardian = 0x524e829F6D6C38653D5BCA78DB7324Af505fE133;

    // Deploy SutoriAccount

    SutoriAccount sutoriAccount;
    address sutoriAccountAddress = getDeployedAddress(
      type(SutoriAccount).creationCode,
      ''
    );

    if (sutoriAccountAddress == address(0)) {
      sutoriAccount = new SutoriAccount{ salt: 0 }();
      console.log('SutoriAccount deployed at:', address(sutoriAccount));
    } else {
      sutoriAccount = SutoriAccount(payable(sutoriAccountAddress));
      console.log('SutoriAccount already deployed at:', address(sutoriAccount));
    }

    // Deploy AccountFactory

    AccountFactory accountFactory;
    address accountFactoryAddress = getDeployedAddress(
      type(AccountFactory).creationCode,
      abi.encode(entryPoint, sutoriAccount, recoveryGuardian)
    );

    if (accountFactoryAddress == address(0)) {
      accountFactory = new AccountFactory{ salt: 0 }(
        entryPoint,
        sutoriAccount,
        recoveryGuardian
      );
      console.log('AccountFactory deployed at:', address(accountFactory));
    } else {
      accountFactory = AccountFactory(payable(accountFactoryAddress));
      console.log(
        'AccountFactory already deployed at:',
        address(accountFactory)
      );
    }

    // Deploy SutoriPaymaster

    address verifyingSigner = 0x9D3224743435d058f4B17Da29E8673DceD1768E7;
    SutoriPaymaster sutoriPaymaster;
    address sutoriPaymasterAddress = getDeployedAddress(
      type(SutoriPaymaster).creationCode,
      abi.encode(entryPoint, verifyingSigner)
    );

    if (accountFactoryAddress == address(0)) {
      sutoriPaymaster = new SutoriPaymaster{ salt: 0 }(
        entryPoint,
        verifyingSigner
      );
      console.log('SutoriPaymaster deployed at:', address(sutoriPaymaster));
    } else {
      sutoriPaymaster = SutoriPaymaster(payable(sutoriPaymasterAddress));
      console.log(
        'SutoriPaymaster already deployed at:',
        address(sutoriPaymaster)
      );
    }

    vm.stopBroadcast();
  }
}
