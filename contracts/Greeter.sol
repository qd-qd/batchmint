//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../interfaces/INFT.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/* @TODO: check if the target contract has the correct shape */
contract Greeter is IERC721Receiver {
    mapping(address => bool) private owners;

    modifier onlyOwner() {
        require(
            owners[msg.sender],
            "you're not allowed to interact with this function"
        );
        _;
    }

    constructor(address[] memory _owners) {
        // Set the msg.sender as one of the owners
        owners[msg.sender] = true;

        // Set the other owners as well
        for (uint16 i = 0; i < _owners.length; i++) {
            owners[_owners[i]] = true;
        }
    }

    function batchMint(
        address _target,
        uint128 _price,
        uint16 _quantity
    ) public payable onlyOwner {
        require(
            msg.value >= _quantity * _price,
            "not enough ETH to mint the batch"
        );

        IDummyNFT target = IDummyNFT(_target);

        for (uint16 i = 0; i < _quantity; i++) {
            target.mint{value: _price}();
        }

        // you only life once
        target.setApprovalForAll(msg.sender, true);
    }

    function transferBatch(address _target, uint256[] memory _ids)
        public
        onlyOwner
    {
        IDummyNFT target = IDummyNFT(_target);

        require(
            target.isApprovedForAll(address(this), msg.sender),
            "you are not approved to transfer the batch"
        );

        for (uint16 i = 0; i < _ids.length; i++) {
            target.transferFrom(address(this), msg.sender, _ids[i]);
        }
    }

    function removeOwner(address _owner) public onlyOwner {
        owners[_owner] = false;
    }

    function addOwner(address _owner) public onlyOwner {
        owners[_owner] = true;
    }

    function isOwner(address _owner) public view returns (bool) {
        return owners[_owner];
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
