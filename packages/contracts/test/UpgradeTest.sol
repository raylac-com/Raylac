pragma solidity ^0.8.13;

import { Test } from 'forge-std-1.9.3/src/Test.sol';
import { Upgrades } from 'openzeppelin-foundry-upgrades/LegacyUpgrades.sol';
import { AccountFactory } from '../src/AccountFactory.sol';
import { RaylacAccount } from '../src/RaylacAccount.sol';
import { AccountFactoryV2 } from '../src/AccountFactoryV2.sol';
import { RaylacAccountV2 } from '../src/RaylacAccountV2.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';

contract UpgradeTest is Test {
  AccountFactory public accountFactory;
  RaylacAccount public accountImplementation;
  AccountFactoryV2 public accountFactoryV2;
  RaylacAccountV2 public accountImplementationV2;

  function setUp() public {
    accountImplementation = new RaylacAccount{ salt: 0 }();
    accountFactory = new AccountFactory{ salt: 0 }(
      IEntryPoint(address(0)),
      accountImplementation
    );

    accountImplementationV2 = new RaylacAccountV2{ salt: 0 }();
    accountFactoryV2 = new AccountFactoryV2{ salt: 0 }(
      IEntryPoint(address(0)),
      accountImplementationV2
    );
  }

  function deployAccount(address stealthSigner) public returns (address) {
    address account = address(accountFactory.createAccount(stealthSigner));

    return account;
  }

  function test_Upgrade() public {
    address account = deployAccount(address(1));

    Upgrades.upgradeProxy(account, 'RaylacAccountV2.sol', '', account);
  }
}
