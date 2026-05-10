import os
from typing import Any

from web3 import Web3

EXECUTION_LOG_ABI: list[dict[str, Any]] = [
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "bytes32", "name": "vaultId", "type": "bytes32"},
            {"indexed": True, "internalType": "bytes32", "name": "proposalId", "type": "bytes32"},
            {"indexed": True, "internalType": "bytes32", "name": "policyHash", "type": "bytes32"},
            {"indexed": False, "internalType": "string", "name": "verdict", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "reason", "type": "string"},
            {"indexed": False, "internalType": "bytes32", "name": "resultHash", "type": "bytes32"},
        ],
        "name": "TreasuryAction",
        "type": "event",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "vaultId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "proposalId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "policyHash", "type": "bytes32"},
            {"internalType": "string", "name": "verdict", "type": "string"},
            {"internalType": "string", "name": "reason", "type": "string"},
            {"internalType": "bytes32", "name": "resultHash", "type": "bytes32"},
        ],
        "name": "logAction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


def blockchain_enabled() -> bool:
    has_signer = bool(os.getenv("TREASURY_EXECUTOR_PRIVATE_KEY") or os.getenv("TREASURY_EXECUTOR_MNEMONIC"))
    return bool(
        os.getenv("MANTLE_RPC_URL")
        and os.getenv("EXECUTION_LOG_CONTRACT")
        and has_signer
    )


def blockchain_read_enabled() -> bool:
    return bool(os.getenv("MANTLE_RPC_URL") and os.getenv("EXECUTION_LOG_CONTRACT"))


def _bytes32_from_id(value: str) -> bytes:
    return Web3.keccak(text=value)


def _bytes32_from_hex(value: str) -> bytes:
    if not value.startswith("0x") or len(value) != 66:
        raise ValueError("policy hash must be a 32-byte hex string")
    return Web3.to_bytes(hexstr=value)


def log_treasury_action(
    vault_id: str, proposal_id: str, policy_hash: str, verdict: str, reason: str
) -> str:
    rpc_url = os.getenv("MANTLE_RPC_URL")
    contract_address = os.getenv("EXECUTION_LOG_CONTRACT")
    private_key = os.getenv("TREASURY_EXECUTOR_PRIVATE_KEY")
    mnemonic = os.getenv("TREASURY_EXECUTOR_MNEMONIC")
    # Mantle mainnet = 5000; Sepolia = 5003 — always set explicitly if not mainnet.
    chain_id = int(os.getenv("MANTLE_CHAIN_ID", "5000"))

    if not (rpc_url and contract_address and (private_key or mnemonic)):
        raise RuntimeError(
            "Missing blockchain config. Set MANTLE_RPC_URL, EXECUTION_LOG_CONTRACT, and executor key or mnemonic."
        )

    provider = Web3.HTTPProvider(rpc_url)
    web3 = Web3(provider)
    if not web3.is_connected():
        raise RuntimeError("Unable to connect to Mantle RPC")

    if private_key:
        account = web3.eth.account.from_key(private_key)
    else:
        web3.eth.account.enable_unaudited_hdwallet_features()
        account = web3.eth.account.from_mnemonic(mnemonic or "")
    contract = web3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=EXECUTION_LOG_ABI)

    nonce = web3.eth.get_transaction_count(account.address)
    gas_price = web3.eth.gas_price
    result_hash = Web3.keccak(text=f"{proposal_id}:{verdict}:{reason}")

    tx = contract.functions.logAction(
        _bytes32_from_id(vault_id),
        _bytes32_from_id(proposal_id),
        _bytes32_from_hex(policy_hash),
        verdict,
        reason,
        result_hash,
    ).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": chain_id,
            "gas": 300000,
            "gasPrice": gas_price,
        }
    )

    signed = account.sign_transaction(tx)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)

    if receipt.status != 1:
        raise RuntimeError("On-chain transaction reverted")

    return web3.to_hex(tx_hash)


def decode_execution_log_tx(tx_hash: str) -> dict[str, Any]:
    rpc_url = os.getenv("MANTLE_RPC_URL")
    contract_address = os.getenv("EXECUTION_LOG_CONTRACT")
    if not (rpc_url and contract_address):
        raise RuntimeError("Missing blockchain read config. Set MANTLE_RPC_URL and EXECUTION_LOG_CONTRACT.")
    if not (tx_hash.startswith("0x") and len(tx_hash) == 66):
        raise RuntimeError("Invalid tx_hash format")

    web3 = Web3(Web3.HTTPProvider(rpc_url))
    if not web3.is_connected():
        raise RuntimeError("Unable to connect to Mantle RPC")

    receipt = web3.eth.get_transaction_receipt(tx_hash)
    contract = web3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=EXECUTION_LOG_ABI)
    events = contract.events.TreasuryAction().process_receipt(receipt)
    if not events:
        raise RuntimeError("No TreasuryAction event found in transaction receipt")
    evt = events[0]
    args = evt["args"]
    return {
        "tx_hash": tx_hash,
        "block_number": receipt.blockNumber,
        "status": receipt.status,
        "contract": contract_address,
        "event": "TreasuryAction",
        "vault_id": Web3.to_hex(args["vaultId"]),
        "proposal_id": Web3.to_hex(args["proposalId"]),
        "policy_hash": Web3.to_hex(args["policyHash"]),
        "verdict": args["verdict"],
        "reason": args["reason"],
        "result_hash": Web3.to_hex(args["resultHash"]),
    }
