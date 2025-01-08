// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

/* solhint-disable reason-string */
/* solhint-disable no-inline-assembly */

import 'account-abstraction-0.6.0/contracts/core/BasePaymaster.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract RaylacPaymaster is BasePaymaster {
  using ECDSA for bytes32;
  using UserOperationLib for UserOperation;

  address public immutable verifyingSigner;

  uint256 private constant _SIG_VALIDATION_SUCCEED = 0;
  uint256 private constant _SIG_VALIDATION_FAILED = 1;

  constructor(
    IEntryPoint _entryPoint,
    address _verifyingSigner
  ) BasePaymaster(_entryPoint) {
    verifyingSigner = _verifyingSigner;
  }

  function pack(
    UserOperation calldata userOp
  ) internal pure returns (bytes memory ret) {
    address sender = userOp.getSender();
    uint256 nonce = userOp.nonce;
    uint256 callGasLimit = userOp.callGasLimit;
    uint256 verificationGasLimit = userOp.verificationGasLimit;
    uint256 preVerificationGas = userOp.preVerificationGas;
    uint256 maxFeePerGas = userOp.maxFeePerGas;
    uint256 maxPriorityFeePerGas = userOp.maxPriorityFeePerGas;

    return
      abi.encode(
        sender,
        nonce,
        userOp.initCode,
        userOp.callData,
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas
      );
  }

  function getHash(
    UserOperation calldata userOp
  ) public view returns (bytes32) {
    //can't use userOp.hash(), since it contains also the paymasterAndData itself.
    return keccak256(abi.encode(pack(userOp), block.chainid, address(this)));
  }

  /**
   * verify our external signer signed this request.
   * the "paymasterAndData" is expected to be the paymaster and a signature over the entire request params
   * paymasterAndData[:20] : address(this)
   * paymasterAndData[20:] : signature
   */
  function _validatePaymasterUserOp(
    UserOperation calldata userOp,
    bytes32 /*userOpHash*/,
    uint256 requiredPreFund
  )
    internal
    view
    override
    returns (bytes memory context, uint256 validationData)
  {
    (requiredPreFund);

    bytes memory signature = userOp.paymasterAndData[20:];

    // we only "require" it here so that the revert reason on invalid signature will be of "VerifyingPaymaster", and not "ECDSA"
    require(
      signature.length == 64 || signature.length == 65,
      'VerifyingPaymaster: invalid signature length in paymasterAndData'
    );
    bytes32 hash = ECDSA.toEthSignedMessageHash(getHash(userOp));

    //don't revert on signature failure: return SIG_VALIDATION_FAILED
    if (verifyingSigner != ECDSA.recover(hash, signature)) {
      return ('', _SIG_VALIDATION_FAILED);
    }

    return ('', _SIG_VALIDATION_SUCCEED);
  }
}
