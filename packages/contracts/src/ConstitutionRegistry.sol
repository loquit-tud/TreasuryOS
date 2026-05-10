// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ConstitutionRegistry {
    struct ConstitutionSnapshot {
        bytes32 policyHash;
        uint64 updatedAt;
    }

    mapping(bytes32 => ConstitutionSnapshot) public latest;

    event ConstitutionStored(bytes32 indexed vaultId, bytes32 indexed policyHash, uint64 updatedAt);

    function store(bytes32 vaultId, bytes32 policyHash) external {
        latest[vaultId] = ConstitutionSnapshot({policyHash: policyHash, updatedAt: uint64(block.timestamp)});
        emit ConstitutionStored(vaultId, policyHash, uint64(block.timestamp));
    }
}
