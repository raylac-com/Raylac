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

  event UserOperationEvent(
    bytes32 indexed userOpHash,
    address indexed sender,
    address indexed paymaster,
    uint256 nonce,
    bool success,
    uint256 actualGasCost,
    uint256 actualGasUsed
  );

  event Upgraded(address indexed implementation);

  AccountFactory accountFactory;
  EntryPoint entryPoint;
  SutoriAccount sutoriAccount;
  SutoriAccount sender;
  VmSafe.Wallet senderWallet;
  ERC20Mock erc20;
  SutoriPaymaster paymaster;
  VmSafe.Wallet paymasterWallet;
  VmSafe.Wallet recoveryGuardianWallet;

  receive() external payable {}

  function setUp() public {
    entryPoint = new EntryPoint();
    sutoriAccount = new SutoriAccount();

    recoveryGuardianWallet = vm.createWallet('recovery guardian');
    paymasterWallet = vm.createWallet('paymaster wallet');

    accountFactory = new AccountFactory(
      entryPoint,
      sutoriAccount,
      recoveryGuardianWallet.addr
    );

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

    // Initialize the sender account
    senderWallet = vm.createWallet('sender');
    sender = accountFactory.createAccount(senderWallet.addr);
  }

  function buildUserOp(
    address _sender,
    bytes memory callData,
    uint256 callGasLimit,
    VmSafe.Wallet memory _senderWallet,
    VmSafe.Wallet memory _paymasterWallet
  ) public view returns (UserOperation memory) {
    uint256 verificationGasLimit = 100000;
    uint256 preVerificationGas = 200000;
    uint256 maxPriorityFeePerGas = 0;
    uint256 maxFeePerGas = 0.00001 ether;

    bytes memory paymasterAndData = '';
    bytes memory signature = '';
    bytes memory initCode = '';

    uint256 nonce = entryPoint.getNonce(_sender, 0);

    UserOperation memory userOp = UserOperation({
      sender: _sender,
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
      _paymasterWallet.privateKey,
      paymasterEthMessageHash
    );
    bytes memory paymasterSig = abi.encodePacked(r, s, v);

    userOp.paymasterAndData = abi.encodePacked(
      address(paymaster),
      paymasterSig
    );

    bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
    bytes32 userOpHashEthMessageHash = userOpHash.toEthSignedMessageHash();

    (v, r, s) = vm.sign(_senderWallet.privateKey, userOpHashEthMessageHash);
    userOp.signature = abi.encodePacked(r, s, v);

    return userOp;
  }

  function buildETHTransferUserOp(
    address _sender,
    address target,
    uint256 tranferAmount,
    VmSafe.Wallet memory _senderWallet,
    VmSafe.Wallet memory _paymasterWallet
  ) public view returns (UserOperation memory) {
    bytes memory callData = abi.encodeWithSignature(
      'execute(address,uint256,bytes)',
      target,
      tranferAmount,
      ''
    );

    uint256 callGasLimit = 100000;
    UserOperation memory userOp = buildUserOp(
      _sender,
      callData,
      callGasLimit,
      _senderWallet,
      _paymasterWallet
    );

    return userOp;
  }

  function buildUpgradeToUserOp(
    address _sender,
    address newImplementation,
    VmSafe.Wallet memory _senderWallet,
    VmSafe.Wallet memory _paymasterWallet
  ) public view returns (UserOperation memory) {
    bytes memory upgradeToCall = abi.encodeWithSignature(
      'upgradeTo(address)',
      newImplementation,
      ''
    );

    // Call the `execute` function on the contract account
    bytes memory callData = abi.encodeWithSignature(
      'execute(address,uint256,bytes)',
      address(sender),
      0,
      upgradeToCall
    );

    uint256 callGasLimit = 100000;
    UserOperation memory userOp = buildUserOp(
      _sender,
      callData,
      callGasLimit,
      _senderWallet,
      _paymasterWallet
    );

    return userOp;
  }

  function buildERC20TransferUserOp(
    address _sender,
    address target,
    uint256 tranferAmount,
    VmSafe.Wallet memory _senderWallet,
    VmSafe.Wallet memory _paymasterWallet
  ) public view returns (UserOperation memory) {
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
      _sender,
      callData,
      callGasLimit,
      _senderWallet,
      _paymasterWallet
    );

    return userOp;
  }

  function test_createAccount() public {
    address stealthSigner = vm.addr(1);

    uint256 gasLeftBefore = gasleft();
    SutoriAccount newAccount = accountFactory.createAccount(stealthSigner);
    uint256 gasLeftAfter = gasleft();
    uint256 codeSize = address(newAccount).code.length;

    uint256 gasUsed = gasLeftBefore - gasLeftAfter;
    console.log('code size: ', codeSize);
    console.log('gas before: ', gasLeftBefore);
    console.log('gas used: ', gasLeftAfter);
    console.log('gas used: ', gasUsed);
  }

  /**
   * Test that `isValidSignature` returns the correct selector for a valid signature
   */
  function test_isValidSignature_validSig() public view {
    // Construct the message to sign
    string memory message = 'hello world';
    bytes32 messageHash = keccak256(abi.encodePacked(message));
    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

    // Sign the message
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      senderWallet.privateKey,
      ethSignedMessageHash
    );
    bytes memory validSignature = abi.encodePacked(r, s, v);

    bytes4 validationData = sender.isValidSignature(
      ethSignedMessageHash,
      validSignature
    );

    // Assert valid signature
    vm.assertTrue(validationData == SutoriAccount.isValidSignature.selector);
  }

  /**
   * Test that `isValidSignature` returns 0 for an invalid signature
   */
  function test_isValidSignature_invalidSig() public {
    // Construct the message to sign
    string memory message = 'hello world';
    bytes32 messageHash = keccak256(abi.encodePacked(message));
    bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

    VmSafe.Wallet memory nonSignerWallet = vm.createWallet('nonSigner');
    // Sign the message with a different wallet
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      nonSignerWallet.privateKey,
      ethSignedMessageHash
    );
    bytes memory invalidSignature = abi.encodePacked(r, s, v);

    bytes4 validationData = sender.isValidSignature(
      ethSignedMessageHash,
      invalidSignature
    );

    // Assert invalid signature
    vm.assertTrue(validationData == 0);
  }

  /**
   * Test that `SutoriAccount` successfully transfers ETH
   */
  function test_ETHTranfser() public {
    // Fund the sender with ETH
    uint256 tranferAmount = 10 ether;
    (bool success, ) = payable(sender).call{ value: tranferAmount }('');
    assert(success);

    address target = address(0);

    UserOperation memory userOp = buildETHTransferUserOp(
      address(sender),
      target,
      tranferAmount,
      senderWallet,
      paymasterWallet
    );

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    entryPoint.handleOps(userOps, beneficiary);

    vm.assertEq(target.balance, tranferAmount);
    vm.assertEq(address(sender).balance, 0);
  }

  /**
   * Test that `SutoriAccount` successfully transfers ERC20 tokens
   */
  function test_ERC20Tranfser() public {
    // Fund the sender
    erc20.transferInternal(address(this), address(sender), 10 ** 18);

    // Sanity check that the sender has no ETH to make sure the paymaster works.
    vm.assertEq(address(sender).balance, 0, 'sender should have no ETH');

    address target = vm.addr(1);
    uint256 tranferAmount = 10 ** 18;

    UserOperation memory userOp = buildERC20TransferUserOp(
      address(sender),
      target,
      tranferAmount,
      senderWallet,
      paymasterWallet
    );
    bytes32 userOpHash = entryPoint.getUserOpHash(userOp);

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    // Check the first 3 topics, but not the data
    vm.expectEmit(true, true, true, false);
    emit UserOperationEvent(
      userOpHash,
      address(sender),
      address(paymaster),
      userOp.nonce,
      true,
      0,
      0
    );
    entryPoint.handleOps(userOps, beneficiary);

    // Check that the user op actaully transferred tokens
    vm.assertEq(erc20.balanceOf(target), tranferAmount);
  }

  /**
   * Test that `handleOps` reverts when the paymaster signature is invalid
   */
  function test_invalidPaymasterSig() public {
    address target = vm.addr(1);
    uint256 tranferAmount = 10 ether;

    // Fund the sender
    (bool success, ) = payable(sender).call{ value: tranferAmount }('');
    assert(success);

    VmSafe.Wallet memory nonPaymasterWallet = vm.createWallet('nonPaymaster');
    UserOperation memory userOp = buildETHTransferUserOp(
      address(sender),
      target,
      tranferAmount,
      senderWallet,
      nonPaymasterWallet
    );

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    vm.expectRevert();
    entryPoint.handleOps(userOps, beneficiary);
  }

  /**
   * Test that the `upgradeTo` function successfully upgrades the contract
   */
  function test_upgradeTo_success() public {
    // Deploy a new version of the contract
    SutoriAccount newSutoriAccount = new SutoriAccount{ salt: 0 }();

    UserOperation memory userOp = buildUpgradeToUserOp(
      address(sender),
      address(newSutoriAccount),
      senderWallet,
      paymasterWallet
    );

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    vm.expectEmit(true, false, false, false);
    emit Upgraded(address(newSutoriAccount));
    entryPoint.handleOps(userOps, beneficiary);

    // Check that the account was upgraded

    // Should be able to call the upgrade contract
    vm.assertEq(address(sender.entryPoint()), address(entryPoint));
  }

  /**
   * Test that `upgradeTo` reverts when the sender is not authorized
   */
  function test_upgradeTo_unauthorized() public {
    // Deploy a new version of the contract
    SutoriAccount newSutoriAccount = new SutoriAccount{ salt: 0 }();

    vm.prank(address(0));
    vm.expectRevert();
    sender.upgradeTo(address(newSutoriAccount));
  }

  function test_setStealthSigner_success() public {
    address newStealthSigner = vm.addr(1);
    vm.prank(recoveryGuardianWallet.addr);
    sender.setStealthSigner(newStealthSigner);

    vm.assertEq(sender.stealthSigner(), newStealthSigner);
  }

  function test_setStealthSigner_unauthorized() public {
    address newStealthSigner = vm.addr(1);

    vm.prank(address(0));
    vm.expectRevert();
    sender.setStealthSigner(newStealthSigner);
  }
}
