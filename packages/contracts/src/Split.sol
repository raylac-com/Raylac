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
import './SutoriAccount.sol';

contract Split {
  struct Transfer {
    address account;
    uint256 amount;
    address tokenContract;
    address to;
    bytes sig;
  }

  function splitAndSend(
    Transfer[] calldata transfers,
    UserOperation[] calldata userOperations
  ) public {
    // Veirfy the signatures
    for (uint256 i = 0; i < transfers.length; i++) {
      Transfer memory tranfser = transfers[i];
      bytes32 hash = keccak256(
        abi.encodePacked(
          tranfser.account,
          tranfser.amount,
          tranfser.tokenContract,
          tranfser.to
        )
      );

      require(
        SutoriAccount(payable(tranfser.account)).isValidSignature(
          hash,
          tranfser.sig
        ) == SutoriAccount.isValidSignature.selector,
        'Split: invalid signature'
      );
    }

    // Call the function `execute` with the signature
    for (uint256 i = 0; i < transfers.length; i++) {
      Transfer memory tranfser = transfers[i];

      (bool success, ) = tranfser.account.call(
        abi.encodeWithSignature(
          'execute(address,uint256,bytes)',
          tranfser.tokenContract,
          0,
          abi.encodeWithSignature(
            'transfer(address,uint256)',
            tranfser.to,
            tranfser.amount
          )
        )
      );
      require(success, 'Split: execute failed');
    }
  }
}
