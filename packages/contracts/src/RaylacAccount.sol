// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction/contracts/interfaces/IAccount.sol';
import 'account-abstraction/contracts/core/BaseAccount.sol';
import 'account-abstraction/contracts/interfaces/UserOperation.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/interfaces/IERC1271.sol';

contract RaylacAccount is
  BaseAccount,
  UUPSUpgradeable,
  Initializable,
  IERC1271
{
  using ECDSA for bytes32;

  IEntryPoint public constant _entryPoint =
    IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

  address public stealthSigner;

  uint256 private constant _SIG_VALIDATION_SUCCEED = 0;
  uint256 private constant _SIG_VALIDATION_FAILED = 1;

  modifier onlySelf() {
    require(msg.sender == address(this), 'only self');
    _;
  }

  receive() external payable {}

  function entryPoint() public view virtual override returns (IEntryPoint) {
    return _entryPoint;
  }

  function initialize(address _stealthSigner) public virtual initializer {
    stealthSigner = _stealthSigner;
  }

  /**
   * execute a transaction (called directly from owner, or by entryPoint)
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
    // _requireFromEntryPoint();
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

  function isValidSignature(
    bytes32 hash,
    bytes memory signature
  ) public view override returns (bytes4 magicValue) {
    bool isValid = ECDSA.recover(hash, signature) == stealthSigner;

    return isValid ? this.isValidSignature.selector : bytes4(0);
  }

  function _validateSignature(
    UserOperation calldata userOp,
    bytes32 userOpHash
  ) internal virtual override returns (uint256 validationData) {
    bytes32 hash = userOpHash.toEthSignedMessageHash();

    if (
      isValidSignature(hash, userOp.signature) != this.isValidSignature.selector
    ) {
      return SIG_VALIDATION_FAILED;
    }

    return _SIG_VALIDATION_SUCCEED;
  }

  function setStealthSigner(address newStelathSigner) public {
    stealthSigner = newStelathSigner;
  }

  /// UUPSUpsgradeable: only allow self-upgrade.
  function _authorizeUpgrade(
    address newImplementation
  ) internal view override onlySelf {
    (newImplementation); // No-op; silence unused parameter warning
  }
}
