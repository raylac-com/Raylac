// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;
import '@openzeppelin/contracts/utils/Create2.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';

contract Utils {
  IEntryPoint entryPoint =
    IEntryPoint(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);

  address constant deployerAddress = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
  address constant paymasterSigner = 0x9D3224743435d058f4B17Da29E8673DceD1768E7;

  /**
   * Compute the address of a contract deployed using CREATE2,
   * and return the address if the contract is deployed, otherwise return address(0).
   */
  function getDeployedAddress(
    bytes memory bytecode,
    bytes memory constructorArgs
  ) public view returns (address) {
    address addr = Create2.computeAddress(
      0,
      keccak256(abi.encodePacked(bytecode, constructorArgs)),
      deployerAddress
    );

    if (addr.code.length == 0) {
      return address(0);
    }

    return addr;
  }
}