// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import 'account-abstraction/contracts/interfaces/IAccount.sol';
import 'account-abstraction/contracts/interfaces/UserOperation.sol';
import 'account-abstraction/contracts/interfaces/IEntryPoint.sol';
import 'account-abstraction/contracts/core/EntryPoint.sol';
import '@openzeppelin/contracts/utils/Create2.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts/mocks/ERC20Mock.sol';
import 'forge-std/console.sol';
import '../src/Registry.sol';
import '../src/IERC5564Announcer.sol';
import 'forge-std/Vm.sol';
import 'forge-std/Test.sol';

contract RegistryTest is Test {
  Registry registry;
  ERC20Mock erc20;
  IERC5564Announcer announcer;

  function setUp() public {
    address erc20MockInitAccount = address(this);
    uint256 erc20MockInitBalance = 100 * 10 ** 18;

    erc20 = new ERC20Mock(
      'test',
      'TEST',
      erc20MockInitAccount,
      erc20MockInitBalance
    );

    announcer = new IERC5564Announcer();

    registry = new Registry(address(announcer));
  }

  function test_transfer() public {
    address[] memory inputs = new address[](2);
    inputs[0] = address(0x1);
    inputs[1] = address(0x2);

    // Tranfser some ERC20 to the inputs
    uint256 amount = 20 * (10 ** 18);
    erc20.transfer(inputs[0], amount);
    erc20.transfer(inputs[1], amount);

    // Allow the registry contract to transfer the ERC20
    vm.prank(inputs[0]);
    erc20.approve(address(registry), type(uint256).max);
    vm.prank(inputs[1]);
    erc20.approve(address(registry), type(uint256).max);

    address[] memory outputs = new address[](2);
    outputs[0] = address(0x3);
    outputs[1] = address(0x4);

    bytes memory proof = new bytes(0);

    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amount;
    amounts[1] = amount;

    Registry.ERC5564Annoucement[]
      memory announcements = new Registry.ERC5564Annoucement[](2);
    
    announcements[0] = Registry.ERC5564Annoucement(
      outputs[0],
      new bytes(0),
      new bytes(0)
    );
    announcements[1] = Registry.ERC5564Annoucement(
      outputs[1],
      new bytes(0),
      new bytes(0)
    );

    registry.transfer(
      inputs,
      outputs,
      amounts,
      announcements,
      address(erc20),
      proof
    );

    // Check that the ERC20 was transferred
    vm.assertEq(erc20.balanceOf(inputs[0]), 0);
    vm.assertEq(erc20.balanceOf(inputs[1]), 0);
    vm.assertEq(erc20.balanceOf(outputs[0]), amount);
    vm.assertEq(erc20.balanceOf(outputs[1]), amount);
  }
}
