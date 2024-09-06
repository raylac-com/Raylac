// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import 'forge-std/Script.sol';
import 'openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol';

contract Deploy is Script {
  function run() external {
    // uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast();

    // Deploy SutoriAccount

    vm.stopBroadcast();
  }
}
