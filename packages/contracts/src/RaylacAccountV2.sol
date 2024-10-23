// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction-0.6.0/contracts/interfaces/IAccount.sol';
import 'account-abstraction-0.6.0/contracts/core/BaseAccount.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/UserOperation.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/interfaces/IERC1271.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './IRaylacAccountV2.sol';

contract RaylacAccountV2 is
  IRaylacAccountV2,
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

  address public stelathTransferContract;

  modifier onlySelf() {
    require(msg.sender == address(this), 'only self');
    _;
  }

  modifier onlyStealthTransfer() {
    require(msg.sender == stelathTransferContract, 'only stealth transfer');
    _;
  }

  receive() external payable {}

  function entryPoint() public view virtual override returns (IEntryPoint) {
    return _entryPoint;
  }

  function initialize(address _stealthSigner) public virtual initializer {
    stealthSigner = _stealthSigner;
    stelathTransferContract = 0x2347C999165179269283b2511C3D6C2b8F3d4722;
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

  function stealthTransfer(
    address tokenAddress,
    uint256 amount
  ) external onlyStealthTransfer {
    if (tokenAddress == address(0)) {
      // Native transfer
      (bool success, ) = payable(stelathTransferContract).call{ value: amount }(
        ''
      );

      if (!success) {
        revert('Native transfer failed');
      }
    } else {
      // ERC20 transfer
      IERC20(tokenAddress).transfer(stelathTransferContract, amount);
    }
  }

  function setStealthTransferContract(
    address _stealthTransferContract
  ) external onlySelf {
    stelathTransferContract = _stealthTransferContract;
  }

  /// UUPSUpsgradeable: only allow self-upgrade.
  function _authorizeUpgrade(
    address newImplementation
  ) internal view override onlySelf {
    (newImplementation); // No-op; silence unused parameter warning
  }
}
