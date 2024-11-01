pragma solidity ^0.8.13;

import { Test } from 'forge-std-1.9.3/src/Test.sol';
import { console } from 'forge-std-1.9.3/src/console.sol';
import { AccountFactoryV2 } from '../src/AccountFactoryV2.sol';
import { RaylacAccountV2 } from '../src/RaylacAccountV2.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';

contract RaylacAccountV2Test is Test {
  IEntryPoint public entryPoint;
  AccountFactoryV2 public accountFactory;

  address public accountImplementation;
  RaylacAccountV2 public account;
  address stealthSigner = address(0x123);

  function setUp() public {
    entryPoint = IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    accountImplementation = address(new RaylacAccountV2{ salt: 0 }());

    accountFactory = new AccountFactoryV2{ salt: 0 }(
      entryPoint,
      RaylacAccountV2(payable(accountImplementation))
    );

    account = accountFactory.createAccount(stealthSigner);
  }

  function test_initialize() public {
    // Shouldn't be able to call twice
    vm.expectRevert('Initializable: contract is already initialized');
    account.initialize(stealthSigner);
  }

  function test_execute() public {
    vm.expectRevert('account: not from EntryPoint');
    account.execute(address(0), 0, '', '');
  }
}
