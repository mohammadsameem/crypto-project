"""
Blockchain Module - Chain Management, Consensus Validation, and Immutability.

This module demonstrates:
1. Cryptographic Hash Linkage: Each block points back to its ancestor via `previous_hash`,
   forming an immutable append-only singly linked chain.
2. Chain Validation & Integrity: Iterating through every block to verify:
   - Recalculated hash matches stored block hash.
   - Current block's `previous_hash` strictly equals preceding block's hash.
   - Proof-of-Work condition (difficulty target prefix) is satisfied.
   - Merkle root matches computed tree from all block transactions.
3. UTXO State Synchronization: Updating the global state machine by removing consumed
   inputs and inserting new outputs upon successful block inclusion.
4. Chain Tampering Simulation: Demonstrating how modifying even a single byte in
   historical transaction data invalidates downstream hash pointers and breaks consensus.
"""

import time
from typing import Any, Dict, List, Optional, Tuple

from blockchain.block import Block
from blockchain.merkle import MerkleTree
from blockchain.transaction import Transaction, TxInput, TxOutput


class Blockchain:
    """
    Manages the decentralized ledger, transaction pool (mempool), and UTXO state.

    Attributes:
        chain (List[Block]): The sequence of confirmed blocks.
        pending_transactions (List[Transaction]): Unconfirmed transactions awaiting mining.
        utxo_set (Dict[Tuple[str, int], TxOutput]): Global unspent transaction output state.
        difficulty (int): Current Proof-of-Work target difficulty (leading hex zeros).
        mining_reward (float): Block reward minted for the miner in each block.
    """

    def __init__(self, difficulty: int = 2, mining_reward: float = 50.0) -> None:
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.utxo_set: Dict[Tuple[str, int], TxOutput] = {}
        self.difficulty: int = difficulty
        self.mining_reward: float = mining_reward
        self.create_genesis_block()

    def create_genesis_block(self) -> None:
        """
        Creates Block #0 (Genesis Block) with a standardized initial state.

        Concept:
            The genesis block is the hardcoded anchor of the entire blockchain.
            It references previous_hash = "0"*64 and mints the initial genesis coin distribution.
        """
        genesis_tx = Transaction.create_coinbase_tx(
            recipient_address="1GENESIS_SATOSHI_NAKAMOTO_ADDR0",
            amount=self.mining_reward
        )
        self.utxo_set[(genesis_tx.tx_id, 0)] = genesis_tx.outputs[0]

        merkle = MerkleTree([genesis_tx])
        genesis_block = Block(
            index=0,
            timestamp=1231006505.0,
            transactions=[genesis_tx],
            previous_hash="0000000000000000000000000000000000000000000000000000000000000000",
            merkle_root=merkle.root,
            nonce=2083236893
        )
        genesis_block.hash = genesis_block.calculate_hash()
        self.chain.append(genesis_block)

    def get_latest_block(self) -> Block:
        """
        Returns the tip (most recent block) of the chain.
        """
        return self.chain[-1]

    def add_transaction(self, transaction: Transaction) -> bool:
        """
        Validates and adds a transaction to the mempool of pending transactions.

        Concept:
            Nodes reject invalid transactions prior to propagation:
            1. Non-coinbase transactions must have at least one input and output.
            2. Inputs must reference unspent outputs in the active UTXO set.
            3. No input may be double-spent within the pending pool.
            4. ECDSA cryptographic signatures must be valid.
            5. Total input value must be >= total output value.

        Args:
            transaction (Transaction): The transaction to be added.

        Returns:
            bool: True if transaction is valid and added to mempool.
        """
        if transaction.is_coinbase:
            self.pending_transactions.append(transaction)
            return True

        if not transaction.inputs or not transaction.outputs:
            raise ValueError("Transaction must contain at least one input and one output.")

        spent_in_mempool = set()
        for pending_tx in self.pending_transactions:
            for inp in pending_tx.inputs:
                spent_in_mempool.add((inp.tx_id, inp.output_index))

        total_input_val = 0.0
        for inp in transaction.inputs:
            utxo_key = (inp.tx_id, inp.output_index)
            if utxo_key in spent_in_mempool:
                raise ValueError(f"Double-spend attempt: UTXO {utxo_key} already spent in pending pool.")
            if utxo_key not in self.utxo_set:
                raise ValueError(f"Invalid input: Referenced UTXO {utxo_key} does not exist or was already spent.")

            total_input_val += self.utxo_set[utxo_key].amount

        total_output_val = sum(out.amount for out in transaction.outputs)
        if total_input_val < total_output_val:
            raise ValueError(
                f"Insufficient funds: Inputs sum to {total_input_val:.4f}, "
                f"but outputs require {total_output_val:.4f}"
            )

        if not transaction.verify_signatures(self.utxo_set):
            raise ValueError("Cryptographic verification failed: Invalid ECDSA signature on inputs.")

        self.pending_transactions.append(transaction)
        return True

    def mine_pending_transactions(self, miner_reward_address: str) -> Block:
        """
        Packs pending transactions into a new block, calculates Merkle root,
        solves Proof-of-Work, updates UTXO state, and appends block to chain.
        """
        coinbase_tx = Transaction.create_coinbase_tx(
            recipient_address=miner_reward_address,
            amount=self.mining_reward
        )
        block_transactions = [coinbase_tx] + self.pending_transactions

        merkle = MerkleTree(block_transactions)

        latest_block = self.get_latest_block()
        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            transactions=block_transactions,
            previous_hash=latest_block.hash,
            merkle_root=merkle.root,
            nonce=0
        )

        new_block.mine_block(self.difficulty)

        for tx in block_transactions:
            if not tx.is_coinbase:
                for inp in tx.inputs:
                    utxo_key = (inp.tx_id, inp.output_index)
                    if utxo_key in self.utxo_set:
                        del self.utxo_set[utxo_key]

            for out_idx, out in enumerate(tx.outputs):
                self.utxo_set[(tx.tx_id, out_idx)] = out

        self.pending_transactions = []
        self.chain.append(new_block)
        return new_block

    def add_block(self, block: Block) -> bool:
        """
        Directly validates and appends a mined block to the chain.
        """
        latest_block = self.get_latest_block()
        if block.previous_hash != latest_block.hash:
            raise ValueError(f"Block previous_hash {block.previous_hash} does not match tip hash {latest_block.hash}")

        if not block.hash.startswith("0" * self.difficulty):
            raise ValueError(f"Block hash {block.hash} does not meet difficulty target {self.difficulty}")

        recalculated = block.calculate_hash()
        if block.hash != recalculated:
            raise ValueError(f"Block hash {block.hash} is corrupted (calculated: {recalculated})")

        self.chain.append(block)
        return True

    def validate_chain(self) -> Tuple[bool, Optional[str]]:
        """
        Validates the entire blockchain for cryptographic integrity and consensus rule compliance.

        Concept:
            Iterates through the chain from genesis to tip:
            1. Recomputes header hash: H(header) must equal stored block.hash.
            2. Checks hash linkage: block[i].previous_hash must equal block[i-1].hash.
            3. Verifies Proof-of-Work: block.hash must start with 'difficulty' zeros (for i > 0).
            4. Verifies Merkle Root: Root must match computed Merkle tree of block's transactions.

        Returns:
            Tuple[bool, Optional[str]]: (is_valid, error_message_if_any)
        """
        for i in range(1, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]

            recomputed_hash = current_block.calculate_hash()
            if current_block.hash != recomputed_hash:
                return (
                    False,
                    f"Integrity Violation at Block #{current_block.index}: "
                    f"Stored hash '{current_block.hash}' does not match recomputed hash '{recomputed_hash}'."
                )

            if current_block.previous_hash != previous_block.hash:
                return (
                    False,
                    f"Linkage Broken at Block #{current_block.index}: "
                    f"previous_hash '{current_block.previous_hash}' does not match "
                    f"preceding Block #{previous_block.index} hash '{previous_block.hash}'."
                )

            target_prefix = "0" * self.difficulty
            if not current_block.hash.startswith(target_prefix):
                return (
                    False,
                    f"Proof-of-Work Invalid at Block #{current_block.index}: "
                    f"Hash '{current_block.hash}' lacks required {self.difficulty} leading zeros."
                )

            merkle_tree = MerkleTree(current_block.transactions)
            if current_block.merkle_root != merkle_tree.root:
                return (
                    False,
                    f"Merkle Root Mismatch at Block #{current_block.index}: "
                    f"Stored root '{current_block.merkle_root}' differs from calculated root '{merkle_tree.root}'."
                )

        return True, None

    def tamper_block(self, index: int, new_data: Any) -> None:
        """
        Artificially alters transaction data in a historical block for educational demonstration.
        """
        if index < 0 or index >= len(self.chain):
            raise IndexError(f"Block index {index} out of range (chain length: {len(self.chain)})")

        target_block = self.chain[index]
        print(f"[TAMPER DEMO] Tampering with transactions in Block #{index}...")

        if isinstance(new_data, list):
            target_block.transactions = new_data
        else:
            fake_tx = Transaction(
                inputs=[TxInput(tx_id="tampered_tx_id", output_index=0)],
                outputs=[TxOutput(recipient="1ATTACKER_POCKETS_ALL_COINS0000", amount=9999.0)]
            )
            target_block.transactions.append(fake_tx)

        print(f"[TAMPER DEMO] Block #{index} transaction list modified. Chain state corrupted.")

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes full blockchain state for UI rendering and inspection.
        """
        return {
            "difficulty": self.difficulty,
            "mining_reward": self.mining_reward,
            "chain_length": len(self.chain),
            "blocks": [block.to_dict() for block in self.chain],
            "pending_transactions": [tx.to_dict() for tx in self.pending_transactions],
            "utxo_count": len(self.utxo_set),
            "utxos": [
                {
                    "tx_id": tx_id,
                    "output_index": out_idx,
                    "recipient": out.recipient,
                    "amount": out.amount
                }
                for (tx_id, out_idx), out in self.utxo_set.items()
            ]
        }
