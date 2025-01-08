// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction-0.6.0/contracts/interfaces/IAccount.sol';
import 'account-abstraction-0.6.0/contracts/core/BaseAccount.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/UserOperation.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract RaylacAccount is BaseAccount {
  using ECDSA for bytes32;
  using UserOperationLib for UserOperation;

  IEntryPoint public constant _entryPoint =
    IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);


  uint256 private constant _SIG_VALIDATION_SUCCEED = 0;
  uint256 private constant _SIG_VALIDATION_FAILED = 1;

  receive() external payable {}

  function entryPoint() public view virtual override returns (IEntryPoint) {
    return _entryPoint;
  }


  /**
   * execute a transaction
   * @param dest destination address to call
   * @param value the value to pass in this call
   * @param func the calldata to pass in this call
   */
  function execute(
    address dest,
    uint256 value,
    bytes calldata func,
    bytes calldata /* tag */
  ) external {
    _requireFromEntryPoint();
    _call(dest, value, func);
  }

  function _call(address target, uint256 value, bytes memory data) internal {
    (bool success, bytes memory result) = target.call{ value: value }(data);

    if (!success) {
      assembly {
        revert(add(result, 32), mload(result))
      }
    }
  }

  function _validateSignature(
    UserOperation calldata userOp,
    bytes32 userOpHash
  ) internal virtual override returns (uint256 validationData) {
    bytes32 hash = userOpHash.toEthSignedMessageHash();

    bool isValid = ECDSA.recover(hash, userOp.signature) == userOp.getSender();

    if (!isValid) {
      return _SIG_VALIDATION_FAILED;
    }

    return _SIG_VALIDATION_SUCCEED;
  }
}
