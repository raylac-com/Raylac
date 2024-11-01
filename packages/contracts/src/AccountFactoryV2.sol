// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction-0.6.0/contracts/interfaces/IAccount.sol';
import 'account-abstraction-0.6.0/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/utils/Create2.sol';
import './RaylacAccountV2.sol';
import './RaylacAccountProxy.sol';

contract AccountFactoryV2 {
  RaylacAccountV2 public immutable accountImplementation;
  IEntryPoint public immutable entryPoint;

  constructor(IEntryPoint _entryPoint, RaylacAccountV2 _accountImplementation) {
    entryPoint = _entryPoint;
    accountImplementation = _accountImplementation;
  }

  function createAccount(
    address stealthSigner
  ) external returns (RaylacAccountV2 ret) {
    // Deploy a new account with CREATE2
    ret = RaylacAccountV2(
      payable(
        new RaylacAccountProxy{ salt: 0 }(
          address(accountImplementation),
          abi.encodeCall(RaylacAccountV2.initialize, (stealthSigner))
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
              abi.encodeCall(RaylacAccountV2.initialize, (stealthSigner))
            )
          )
        )
      );
  }
}
