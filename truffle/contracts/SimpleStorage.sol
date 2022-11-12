// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract SimpleStorage {
  string storeDataHash;

  function read() public view returns (string memory) {
    return storeDataHash;
  }

  function write(string memory _newDataHash) public {
    storeDataHash = _newDataHash;
  }
}
