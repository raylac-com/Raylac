// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction/contracts/interfaces/IAccount.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/utils/Create2.sol';
import './SutoriAccount.sol';

contract AccountFactory {
  SutoriAccount public immutable accountImplementation;
  IEntryPoint public immutable entryPoint;

  address public immutable recoveryGuardian;

  constructor(
    IEntryPoint _entryPoint,
    SutoriAccount _accountImplementation,
    address _recoveryGuardian
  ) {
    entryPoint = _entryPoint;
    accountImplementation = _accountImplementation;
    recoveryGuardian = _recoveryGuardian;
  }

  function createAccount(
    address stealthSigner
  ) external returns (SutoriAccount ret) {
    address addr = getAddress(stealthSigner);
    uint codeSize = addr.code.length;
    if (codeSize > 0) {
      return SutoriAccount(payable(addr));
    }

    // Deploy a new account with CREATE2
    ret = SutoriAccount(
      payable(
        new ERC1967Proxy{ salt: 0 }(
          address(accountImplementation),
          abi.encodeCall(
            SutoriAccount.initialize,
            (entryPoint, stealthSigner, recoveryGuardian)
          )
        )
      )
    );
  }

  /**
   * calculate the counterfactual address of this account as it would be returned by createAccount()
   */
  function getAddress(address stealthSigner) public view returns (address) {
    return
      Create2.computeAddress(
        bytes32(0),
        keccak256(
          abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
              address(accountImplementation),
              abi.encodeCall(
                SutoriAccount.initialize,
                (entryPoint, stealthSigner, recoveryGuardian)
              )
            )
          )
        )
      );
  }
}
