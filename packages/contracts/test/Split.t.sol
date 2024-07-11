// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'forge-std/Test.sol';
import '../src/Split.sol';
import '@openzeppelin/contracts/mocks/ERC20Mock.sol';
import 'forge-std/console.sol';
import '../src/AccountFactory.sol';
import '../src/SutoriAccount.sol';
import 'account-abstraction/contracts/core/EntryPoint.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import 'forge-std/Vm.sol';

contract TestSplit is Test {
  EntryPoint entryPoint;
  SutoriAccount sutoriAccount;
  Split split;
  ERC20Mock erc20;
  AccountFactory accountFactory;
  VmSafe.Wallet senderWallet;

  function setUp() public {
    split = new Split();
    entryPoint = new EntryPoint();
    sutoriAccount = new SutoriAccount();

    VmSafe.Wallet memory recoveryGuardianWallet = vm.createWallet(
      'recovery guardian'
    );
    VmSafe.Wallet memory paymasterWallet = vm.createWallet('paymaster wallet');

    accountFactory = new AccountFactory(
      entryPoint,
      sutoriAccount,
      recoveryGuardianWallet.addr
    );

    address erc20MockInitAccount = address(this);
    uint256 erc20MockInitBalance = 1000 ** 18;

    erc20 = new ERC20Mock(
      'test',
      'TEST',
      erc20MockInitAccount,
      erc20MockInitBalance
    );

    // Initialize the sender account
    senderWallet = vm.createWallet('sender');
   // sender = accountFactory.createAccount(senderWallet.addr);
  }

  function test_split() public {
    // Fund the account
    erc20.transfer(senderWallet.addr, 1000);

    Split.Transfer[] memory transfers = new Split.Transfer[](2);

    vm.prank(senderWallet.addr);
    erc20.approve(address(split), 1000);

    transfers[0] = Split.Transfer({
      account: address(senderWallet.addr),
      amount: 100,
      tokenContract: address(erc20),
      to: vm.addr(1)
    });

    transfers[1] = Split.Transfer({
      account: address(senderWallet.addr),
      amount: 200,
      tokenContract: address(erc20),
      to: vm.addr(2)
    });

    split.split(transfers);

    vm.assertEq(erc20.balanceOf(transfers[0].to), transfers[0].amount);
    vm.assertEq(erc20.balanceOf(transfers[1].to), transfers[1].amount);
  }
}
