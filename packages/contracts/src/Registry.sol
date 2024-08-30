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
import './IERC5564Announcer.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'forge-std/console.sol';

contract Registry {
  address immutable erc5564Address;

  struct ERC5564Annoucement {
    address stealthAddress;
    bytes ephemeralPubKey;
    bytes metadata;
  }

  constructor(address _erc5564Address) {
    erc5564Address = _erc5564Address;
  }

  /**
   * @dev Transfer notes from one address to another
   * @param inputs The notes to transfer from
   * @param outputs The notes to transfer to
   * @param amounts The amounts to transfer
   * @param proof The proof that the outputs are correct
   */
  function transfer(
    address[] calldata inputs,
    address[] calldata outputs,
    uint256[] calldata amounts,
    ERC5564Annoucement[] calldata announcements,
    address tokenAddress,
    bytes calldata proof
  ) public {
    require(
      inputs.length == outputs.length,
      "inputs and outputs length don't match"
    );

    require(
      inputs.length == amounts.length,
      "inputs and amounts length don't match"
    );

    require(
      inputs.length == announcements.length,
      "inputs and announcements length don't match"
    );

    for (uint256 i = 0; i < inputs.length; i++) {
      ERC20(tokenAddress).transferFrom(inputs[i], outputs[i], amounts[i]);
    }

    // TODO: Verify the proof
    // TODO: Check that the public inputs are correct
    // TODO: Emit events

    // Announce the stealth addresses
    for (uint256 i = 0; i < announcements.length; i++) {
      IERC5564Announcer(erc5564Address).announce(
        0,
        announcements[i].stealthAddress,
        announcements[i].ephemeralPubKey,
        announcements[i].metadata
      );
    }
  }
}
