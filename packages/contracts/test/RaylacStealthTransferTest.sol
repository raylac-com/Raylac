pragma solidity ^0.8.13;

import { Test } from 'forge-std-1.9.3/src/Test.sol';
import { console } from 'forge-std-1.9.3/src/console.sol';
import { RaylacStealthTransfer } from '../src/RaylacStealthTransfer.sol';
import { AccountFactoryV2 } from '../src/AccountFactoryV2.sol';
import { RaylacAccountV2 } from '../src/RaylacAccountV2.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';

contract RaylacStealthTransferTest is Test {
  RaylacStealthTransfer public stealthTransfer;
  AccountFactoryV2 public accountFactory;
  RaylacAccountV2 public accountImplementation;

  function setUp() public {
    stealthTransfer = new RaylacStealthTransfer();
    accountImplementation = new RaylacAccountV2();
    accountFactory = new AccountFactoryV2(
      IEntryPoint(address(0)),
      accountImplementation
    );
  }

  function deployAccount(address stealthSigner) public returns (address) {
    address account = address(accountFactory.createAccount(stealthSigner));

    return account;
  }

  function test_Transfer() public {
    address tokenAddress = address(0);
    bytes memory proof = '';

    RaylacStealthTransfer.Input[]
      memory inputs = new RaylacStealthTransfer.Input[](2);
    RaylacStealthTransfer.Output[]
      memory outputs = new RaylacStealthTransfer.Output[](2);

    address inputAccount1 = deployAccount(address(0));
    address inputAccount2 = deployAccount(address(1));

    uint256 amount = 1 ether;
    vm.deal(inputAccount1, amount);
    vm.deal(inputAccount2, amount);

    vm.prank(address(inputAccount1));
    RaylacAccountV2(payable(inputAccount1)).setStealthTransferContract(
      address(stealthTransfer)
    );

    vm.prank(address(inputAccount2));
    RaylacAccountV2(payable(inputAccount2)).setStealthTransferContract(
      address(stealthTransfer)
    );

    inputs[0] = RaylacStealthTransfer.Input({
      addr: inputAccount1,
      amount: amount
    });
    inputs[1] = RaylacStealthTransfer.Input({
      addr: inputAccount2,
      amount: amount
    });

    outputs[0] = RaylacStealthTransfer.Output({
      addr: address(1),
      amount: amount
    });

    outputs[1] = RaylacStealthTransfer.Output({
      addr: address(2),
      amount: amount
    });

    stealthTransfer.transfer(tokenAddress, proof, inputs, outputs);
  }
}
