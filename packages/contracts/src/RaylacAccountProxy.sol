// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import '@openzeppelin/contracts/proxy/Proxy.sol';

contract RaylacAccountProxy is Proxy {
  address immutable implementation;

  constructor(address impl, bytes memory data) payable {
    implementation = impl;
    (bool success, ) = implementation.delegatecall(data);
    require(success, 'RaylacAccountProxy: failed to initialize');
  }

  function _implementation()
    internal
    view
    virtual
    override
    returns (address impl)
  {
    return implementation;
  }
}