// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

pragma solidity ^0.6.11;

import "./L2ITokenGateway.sol";
import "../l1/L1ITokenGateway.sol";
import "./L2CrossDomainEnabled.sol";
import "../library/Initializable.sol";

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

interface Mintable {
  function mintMSD(address token, address usr, uint256 wad) external;

  function burn(address usr, uint256 wad) external;
}

contract L2USXGateway is Initializable, L2CrossDomainEnabled, L2ITokenGateway {
  using SafeMathUpgradeable for uint256;
  // --- Auth ---
  mapping(address => uint256) public wards;

  function rely(address usr) external auth {
    wards[usr] = 1;
    emit Rely(usr);
  }

  function deny(address usr) external auth {
    wards[usr] = 0;
    emit Deny(usr);
  }

  modifier auth() {
    require(wards[msg.sender] == 1, "L2USXGateway/not-authorized");
    _;
  }

  event Rely(address indexed usr);
  event Deny(address indexed usr);

  address public l1USX;
  address public l2USX;
  address public l1Counterpart;
  address public l2Router;
  address public l2msdController;
  uint256 public isOpen;
  uint256 public totalMint;

  event Closed();

  constructor(
    address _l1Counterpart,
    address _l2Router,
    address _l1USX,
    address _l2USX,
    address _l2msdController
  ) public {
    initialize(_l1Counterpart, _l2Router, _l1USX, _l2USX, _l2msdController);
  }

  function initialize(
    address _l1Counterpart,
    address _l2Router,
    address _l1USX,
    address _l2USX,
    address _l2msdController
  ) public initializer {
    isOpen = 1;
    wards[msg.sender] = 1;
    emit Rely(msg.sender);

    l1USX = _l1USX;
    l2USX = _l2USX;
    l1Counterpart = _l1Counterpart;
    l2Router = _l2Router;
    l2msdController = _l2msdController;
    totalMint = 0;
  }

  function close() external auth {
    isOpen = 0;

    emit Closed();
  }

  function outboundTransfer(
    address l1Token,
    address to,
    uint256 amount,
    bytes calldata data
  ) external returns (bytes memory) {
    return outboundTransfer(l1Token, to, amount, 0, 0, data);
  }

  function outboundTransfer(
    address l1Token,
    address to,
    uint256 amount,
    uint256, // maxGas
    uint256, // gasPriceBid
    bytes calldata data
  ) public override returns (bytes memory res) {
    require(isOpen == 1, "L2USXGateway/closed");
    require(l1Token == l1USX, "L2USXGateway/token-not-USX");

    (address from, bytes memory extraData) = parseOutboundData(data);
    require(extraData.length == 0, "L2USXGateway/call-hook-data-not-allowed");

    Mintable(l2USX).burn(from, amount);
    totalMint = totalMint.sub(amount);

    uint256 id = sendTxToL1(
      from,
      l1Counterpart,
      getOutboundCalldata(l1Token, from, to, amount, extraData)
    );

    // we don't need to track exitNums (b/c we have no fast exits) so we always use 0
    emit WithdrawalInitiated(l1Token, from, to, id, 0, amount);

    return abi.encode(id);
  }

  function getOutboundCalldata(
    address token,
    address from,
    address to,
    uint256 amount,
    bytes memory data
  ) public pure returns (bytes memory outboundCalldata) {
    outboundCalldata = abi.encodeWithSelector(
      L1ITokenGateway.finalizeInboundTransfer.selector,
      token,
      from,
      to,
      amount,
      abi.encode(0, data) // we don't need to track exitNums (b/c we have no fast exits) so we always use 0
    );

    return outboundCalldata;
  }

  function finalizeInboundTransfer(
    address l1Token,
    address from,
    address to,
    uint256 amount,
    bytes calldata // data -- unsused
  ) external override onlyL1Counterpart(l1Counterpart) {
    require(l1Token == l1USX, "L2USXGateway/token-not-USX");

    Mintable(l2msdController).mintMSD(l2USX, to, amount);
    totalMint = totalMint.add(amount);

    emit DepositFinalized(l1Token, from, to, amount);
  }

  function calculateL2TokenAddress(address l1Token) external view override returns (address) {
    if (l1Token != l1USX) {
      return address(0);
    }

    return l2USX;
  }

  function parseOutboundData(bytes memory data)
    internal
    view
    returns (address from, bytes memory extraData)
  {
    if (msg.sender == l2Router) {
      (from, extraData) = abi.decode(data, (address, bytes));
    } else {
      from = msg.sender;
      extraData = data;
    }
  }

  function counterpartGateway() external view override returns (address) {
    return l1Counterpart;
  }
}
