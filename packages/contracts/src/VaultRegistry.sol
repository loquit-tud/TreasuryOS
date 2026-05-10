// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VaultRegistry {
    struct VaultInfo {
        address owner;
        bytes32 constitutionHash;
        bool active;
        uint64 createdAt;
    }

    mapping(bytes32 => VaultInfo) public vaults;

    event VaultRegistered(bytes32 indexed vaultId, address indexed owner, bytes32 constitutionHash);
    event VaultConstitutionUpdated(bytes32 indexed vaultId, bytes32 constitutionHash);

    function registerVault(bytes32 vaultId, bytes32 constitutionHash) external {
        require(vaults[vaultId].createdAt == 0, "vault exists");
        vaults[vaultId] = VaultInfo({
            owner: msg.sender,
            constitutionHash: constitutionHash,
            active: true,
            createdAt: uint64(block.timestamp)
        });
        emit VaultRegistered(vaultId, msg.sender, constitutionHash);
    }

    function updateConstitutionHash(bytes32 vaultId, bytes32 constitutionHash) external {
        VaultInfo storage info = vaults[vaultId];
        require(info.createdAt != 0, "vault missing");
        require(info.owner == msg.sender, "not owner");
        info.constitutionHash = constitutionHash;
        emit VaultConstitutionUpdated(vaultId, constitutionHash);
    }
}
