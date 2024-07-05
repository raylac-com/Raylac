// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction/contracts/interfaces/IAccount.sol';
import 'account-abstraction/contracts/interfaces/UserOperation.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import 'account-abstraction/contracts/core/EntryPoint.sol';
import '@openzeppelin/contracts/utils/Create2.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/mocks/ERC20Mock.sol';
import 'forge-std/console.sol';
import '../src/AccountFactory.sol';
import '../src/SutoriAccount.sol';
import '../src/SutoriPaymaster.sol';
import 'forge-std/Vm.sol';
import 'forge-std/Test.sol';

contract Payamster is Test {
  EntryPoint entryPoint;
  SutoriPaymaster paymaster;

  function setUp() public {
    entryPoint = new EntryPoint();
    VmSafe.Wallet memory paymasterWallet = vm.createWallet('paymasterWallet');

    // create a new paymaster
    paymaster = new SutoriPaymaster(entryPoint, paymasterWallet.addr);
  }

  function test_validatePaymasterUserOp() public {}
}
