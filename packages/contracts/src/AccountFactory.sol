// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction/contracts/interfaces/IAccount.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol';
import '@openzeppelin/contracts/utils/Create2.sol';
import './SutoriAccount.sol';
import 'forge-std/console.sol';

contract AccountFactory {
  SutoriAccount public immutable accountImplementation;

  address public recoveryPubKey;

  constructor(SutoriAccount _accountImplementation, address _recoveryPubKey) {
    accountImplementation = _accountImplementation;
    recoveryPubKey = _recoveryPubKey;
  }

  function createAccount(
    address stealthSigner
  ) external returns (SutoriAccount ret) {
    address addr = getAddress(stealthSigner);
    uint codeSize = addr.code.length;
    if (codeSize > 0) {
      console.log('account already exists', addr);
      return SutoriAccount(payable(addr));
    }

    // Deploy a new account with CREATE2
    ret = SutoriAccount(
      payable(
        new ERC1967Proxy{
          salt: bytes32(
            0xe66ff94bc7bd0e9311b673dab0c56b93107dae936867627a8f18070a466ef7a2
          )
        }(
          address(accountImplementation),
          abi.encodeCall(SutoriAccount.initialize, (stealthSigner))
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
        bytes32(
          0xe66ff94bc7bd0e9311b673dab0c56b93107dae936867627a8f18070a466ef7a2
        ),
        keccak256(
          abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(
              address(accountImplementation),
              abi.encodeCall(SutoriAccount.initialize, (stealthSigner))
            )
          )
        )
      );
  }
}
