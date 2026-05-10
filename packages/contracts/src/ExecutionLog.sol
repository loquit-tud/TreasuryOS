// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ExecutionLog {
    event TreasuryAction(
        bytes32 indexed vaultId,
        bytes32 indexed proposalId,
        bytes32 indexed policyHash,
        string verdict,
        string reason,
        bytes32 resultHash
    );

    function logAction(
        bytes32 vaultId,
        bytes32 proposalId,
        bytes32 policyHash,
        string calldata verdict,
        string calldata reason,
        bytes32 resultHash
    ) external {
        emit TreasuryAction(vaultId, proposalId, policyHash, verdict, reason, resultHash);
    }
}
