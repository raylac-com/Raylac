// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std-1.9.3/src/Script.sol';
import '../src/AccountFactoryV2.sol';
import '../src/RaylacAccountV2.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import './Utils.s.sol';
import '../src/RaylacPaymaster.sol';

contract DeployV2 is Script, Utils {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    if (deployerPrivateKey == 0) {
      vm.startBroadcast();
    } else {
      vm.startBroadcast(deployerPrivateKey);
    }

    // Deploy RaylacAccountV2

    RaylacAccountV2 raylacAccountV2;
    address raylacAccountV2Address = getAddress(
      type(RaylacAccountV2).creationCode,
      ''
    );

    if (!isDeployed(raylacAccountV2Address)) {
      raylacAccountV2 = new RaylacAccountV2{ salt: 0 }();
      console.log('RaylacAccountV2 deployed at:', address(raylacAccountV2));
    } else {
      raylacAccountV2 = RaylacAccountV2(payable(raylacAccountV2Address));
      console.log(
        'RaylacAccountV2 already deployed at:',
        address(raylacAccountV2)
      );
    }

    // Deploy AccountFactoryV2

    AccountFactoryV2 accountFactoryV2;
    address accountFactoryV2Address = getAddress(
      type(AccountFactoryV2).creationCode,
      abi.encode(entryPoint, raylacAccountV2)
    );

    if (!isDeployed(accountFactoryV2Address)) {
      accountFactoryV2 = new AccountFactoryV2{ salt: 0 }(
        entryPoint,
        raylacAccountV2
      );
      console.log('AccountFactoryV2 deployed at:', address(accountFactoryV2));
    } else {
      accountFactoryV2 = AccountFactoryV2(payable(accountFactoryV2Address));
      console.log(
        'AccountFactoryV2 already deployed at:',
        address(accountFactoryV2)
      );
    }

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
