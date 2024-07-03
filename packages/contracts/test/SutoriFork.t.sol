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

contract TestSutoriFork is Test {
  using ECDSA for bytes32;

  AccountFactory accountFactory;
  EntryPoint entryPoint;
  SutoriAccount sutoriAccount;
  SutoriPaymaster paymaster;

  receive() external payable {}

  function setUp() public {
    entryPoint = EntryPoint(
      payable(address(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789))
    );

    sutoriAccount = SutoriAccount(
      payable(address(0x9Cb3211c7BEADC982Fe2E97Ba7AE6045c5Ce2983))
    );
    accountFactory = AccountFactory(0xA3813b762cBF0c06018db9a648AAe2aD7D86Fbbe);

    paymaster = SutoriPaymaster(
      payable(address(0xB9e5f8ad1A8d925059478260A63F02D001406be5))
    );
  }

  function buildUserOp(
    address sender,
    bytes memory initCode,
    bytes memory callData,
    bytes memory paymasterAndData,
    bytes memory signature,
    VmSafe.Wallet memory wallet
  ) public view returns (UserOperation memory) {
    uint256 verificationGasLimit = 0x61a80;
    uint256 preVerificationGas = 0x15f90;
    uint256 maxFeePerGas = 0x2540be400;
    uint256 maxPriorityFeePerGas = 0x5d21dba0;
    uint256 callGasLimit = 0x186a0;

    uint256 nonce = 0;

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

    bytes32 userOpHash = entryPoint.getUserOpHash(userOp);
    bytes32 userOpHashEthMessageHash = userOpHash.toEthSignedMessageHash();
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      wallet.privateKey,
      userOpHashEthMessageHash
    );
    // userOp.signature = abi.encodePacked(r, s, v);

    return userOp;
  }

  function test_isSignatureValid() public {
    bytes
      memory sig = hex'6174afbc0c012465861d922590ce6006d1d116b7729a74ec8b9a23f1fdb34acf0eca6ca31a0e3e120b28403e6a88e8425c1e90d564a0fab9e4075c435d515cb71b';

    SutoriAccount account = SutoriAccount(
      payable(address(0xB7C3Dc42CBC566B6168f1431ce83C0Fcf6543F8B))
    );

    account.isValidSignature(0x0, sig);
  }

  function test_handleOps() public {
    VmSafe.Wallet memory wallet = vm.createWallet("bob's wallet");
    address sender = 0xb131aCD18Bb05fEe084d12bDF6d6D367C37Bd6Ae;

    // Fund the sender
    //    (bool success, ) = payable(sender).call{ value: 10 ether }('');
    //    assert(success);

    bytes
      memory initCode = hex'A3813b762cBF0c06018db9a648AAe2aD7D86Fbbea9ea858f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004104dc4cbef4457503f4d99741e2414e55a97a377bbb1906884d2ba3feac3282797a061fa56752f06ddc3cf068552c96d3f61aa5e358047ce122e863d040997502be00000000000000000000000000000000000000000000000000000000000000';

    bytes
      memory callData = hex'b61d27f6000000000000000000000000036cbd53842c5426634e7929541ec2318f3dcf7e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000094f149b27065aa60ef053788f6b8a60c53c001d400000000000000000000000000000000000000000000000000000000001e848000000000000000000000000000000000000000000000000000000000';

    bytes
      memory paymasterAndData = hex'B9e5f8ad1A8d925059478260A63F02D001406be599d0278ffd51ecdd4844757fddd06b80125dfd252b5469668a804b8f5516b48753a8ad30d1c48dbf3ed034eabbac58ff21b8474be87a4832147d51a3c6b0209b1b';

    bytes
      memory paymasterSig = hex'91f8ab865d4e61a572448e980e443118085633bcac641ee608bc4fbc658947c44020e1d7c6b8a7d876532dcf4e797649cdbb93b55f3f1a305cb08e8bba3af8171c';

    bytes
      memory signature = hex'1c5aaf881e0ac15ab55cbf89a92dceca4e7b1a22dc9fcc6bbcffb74563c01cb934ba681fe302f66908f7e1916537639e279eff8dd281966bbadede09ace514651c';

    UserOperation memory userOp = buildUserOp(
      sender,
      initCode,
      callData,
      paymasterAndData,
      signature,
      wallet
    );

    bytes32 userOphash = entryPoint.getUserOpHash(userOp);
    console.logBytes32(userOphash);
    bytes32 userOpEthMessageHash = userOphash.toEthSignedMessageHash();

    address recoveredSender = ECDSA.recover(userOpEthMessageHash, signature);
    console.log('recoveredSender', recoveredSender);

    bytes32 paymasetrUserOpHash = paymaster.getHash(userOp);

    bytes32 hash = paymasetrUserOpHash.toEthSignedMessageHash();

    address recoveredSigner = ECDSA.recover(hash, paymasterSig);
    console.log('recoveredSigner', recoveredSigner);

    UserOperation[] memory userOps = new UserOperation[](1);
    userOps[0] = userOp;

    address payable beneficiary = payable(address(this));

    entryPoint.handleOps(userOps, beneficiary);
  }
}
