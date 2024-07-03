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

contract TestSutori is Test {
  using ECDSA for bytes32;

  AccountFactory accountFactory;
  EntryPoint entryPoint;
  SutoriAccount sutoriAccount;
  ERC20Mock erc20;
  SutoriPaymaster paymaster;
  VmSafe.Wallet paymasterWallet;

  receive() external payable {}

  function setUp() public {
    entryPoint = new EntryPoint();

    sutoriAccount = new SutoriAccount(entryPoint);
    address recoveryPubKey = 0xb3F7dAf94A3816e4b2Cb21fA5622A0DfeEB58E0A;
    paymasterWallet = vm.createWallet('paymaster wallet');

    accountFactory = new AccountFactory(sutoriAccount, recoveryPubKey);

    paymaster = new SutoriPaymaster(entryPoint, paymasterWallet.addr);

    // Fund the paymaster
    (bool success, ) = payable(paymasterWallet.addr).call{ value: 10 ether }(
      ''
    );
    assert(success);

    // Deposit funds to entry point from paymaster
    paymaster.deposit{ value: 10 ether }();

    address erc20MockInitAccount = address(this);
    uint256 erc20MockInitBalance = 1000 ** 18;
    erc20 = new ERC20Mock(
      'test',
      'TEST',
      erc20MockInitAccount,
      erc20MockInitBalance
    );
  }

  function test_isValidSignature() public {
    VmSafe.Wallet memory wallet = vm.createWallet("bob's wallet");

    // Create the contract account here
    SutoriAccount account = accountFactory.createAccount(wallet.addr);

    string memory message = 'hello world';
    bytes32 messageHash = keccak256(abi.encodePacked(message));

    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      wallet.privateKey,
      ethSignedMessageHash
    );
    bytes memory signature = abi.encodePacked(r, s, v);

    bytes4 validationData = account.isValidSignature(
      ethSignedMessageHash,
      signature
    );

    vm.assertTrue(validationData == SutoriAccount.isValidSignature.selector);
  }

  function buildUserOp(
    address sender,
    bytes memory callData,
    uint256 callGasLimit,
    VmSafe.Wallet memory wallet
  ) public view returns (UserOperation memory) {
    uint256 verificationGasLimit = 100000;
    uint256 preVerificationGas = 200000;
    uint256 maxPriorityFeePerGas = 0;
    uint256 maxFeePerGas = 0.00001 ether;

    bytes memory paymasterAndData = '';
    bytes memory signature = '';
    bytes memory initCode = '';

    uint256 nonce = entryPoint.getNonce(sender, 0);

    UserOperation memory userOp = UserOperation({
      sender: sender,
      nonce: nonce,
      initCode: initCode,
      callData: callData,
      callGasLimit: callGasLimit,
      verificationGasLimit: verificationGasLimit,
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      preVerificationGas: preVerificationGas,
      paymasterAndData: paymasterAndData,
      signature: signature
    });

    bytes32 paymasterMessageHash = paymaster.getHash(userOp);

    bytes32 paymasterEthMessageHash = paymasterMessageHash
      .toEthSignedMessageHash();

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      paymasterWallet.privateKey,
      paymasterEthMessageHash
    );
    bytes memory paymasterSig = abi.encodePacked(r, s, v);

    userOp.paymasterAndData = abi.encodePacked(
      address(paymaster),
      paymasterSig
    );

    bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
    bytes32 userOpHashEthMessageHash = userOpHash.toEthSignedMessageHash();

    (v, r, s) = vm.sign(wallet.privateKey, userOpHashEthMessageHash);
    userOp.signature = abi.encodePacked(r, s, v);

    return userOp;
  }

  function deploySender(
    VmSafe.Wallet memory wallet
  ) public returns (SutoriAccount) {
    SutoriAccount sender = accountFactory.createAccount(wallet.addr);
    return sender;
  }

  function test_DeploySender() public {
    VmSafe.Wallet memory wallet = vm.createWallet("bob's wallet");

    // Create the contract account here
    SutoriAccount account = deploySender(wallet);

    console.log('account address: ', address(account));
  }

  function test_transferETH() public {
    VmSafe.Wallet memory wallet = vm.createWallet("bob's wallet");

    // Create the contract account here
    SutoriAccount _sender = deploySender(wallet);
    address sender = address(_sender);

    (bool success, ) = payable(sender).call{ value: 10 ether }('');
    assert(success);

    address target = address(0);
    uint256 tranferAmount = 10 ether;
    // Call the `execute` function on the contract account
    bytes memory callData = abi.encodeWithSignature(
      'execute(address,uint256,bytes)',
      target,
      tranferAmount,
      ''
    );

    uint256 callGasLimit = 100000;
    UserOperation memory userOp = buildUserOp(
      sender,
      callData,
      callGasLimit,
      wallet
    );

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    entryPoint.handleOps(userOps, beneficiary);

    vm.assertEq(target.balance, tranferAmount);
    vm.assertEq(sender.balance, 0);
  }

  function test_transferERC20() public {
    VmSafe.Wallet memory wallet = vm.createWallet("bob's wallet");

    // Create the contract account here
    SutoriAccount _sender = deploySender(wallet);
    address sender = address(_sender);

    // Fund the sender
    erc20.transferInternal(address(this), sender, 10 ** 18);

    // Sanity check that the sender has no ETH
    vm.assertEq(sender.balance, 0, 'sender should have no ETH');

    address target = vm.addr(1);
    uint256 tranferAmount = 10 ** 18;

    bytes memory erc20TransferCall = abi.encodeWithSignature(
      'transfer(address,uint256)',
      target,
      tranferAmount
    );

    // Call the `execute` function on the contract account
    bytes memory callData = abi.encodeWithSignature(
      'execute(address,uint256,bytes)',
      address(erc20),
      0,
      erc20TransferCall
    );

    uint256 callGasLimit = 100000;
    UserOperation memory userOp = buildUserOp(
      sender,
      callData,
      callGasLimit,
      wallet
    );

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    entryPoint.handleOps(userOps, beneficiary);

    vm.assertEq(erc20.balanceOf(target), tranferAmount);
  }
}
