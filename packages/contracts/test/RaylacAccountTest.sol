pragma solidity ^0.8.13;

import { Test } from 'forge-std-1.9.3/src/Test.sol';
import { console } from 'forge-std-1.9.3/src/console.sol';
import { RaylacAccount } from '../src/RaylacAccount.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';

contract RaylacAccountTest is Test {
  IEntryPoint public entryPoint;
  address public accountImplementation;
  RaylacAccount public account;

  function setUp() public {
    entryPoint = IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

    accountImplementation = address(new RaylacAccount{ salt: 0 }());

    account = RaylacAccount(payable(accountImplementation));
  }

  function test_CannotExecuteWithoutEntryPoint() public {
    vm.expectRevert('account: not from EntryPoint');
    account.execute(address(0), 0, '', '');
  }
}
