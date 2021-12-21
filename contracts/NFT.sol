//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 ** This contract shouldn't be deployed. 
 ** It's just a template to simulate communicate with an ERC721 contract.
 */
contract DummyNFT is ERC721 {
    address public owner;
    uint128 private tokenCounter = 1;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    function mint() public payable {
        _safeMint(msg.sender, tokenCounter);
        tokenCounter++;
    }

    function getTokenCounter() public view returns (uint128) {
        return tokenCounter;
    }
}
