"""
Block Module - Bitcoin-Style Block and Proof-of-Work Implementation.

This module demonstrates:
1. Block Header Structure: Packaging block metadata (index, timestamp, previous_hash,
   merkle_root, nonce) separately from the transaction payload.
2. SHA-256 Cryptographic Hash Function: Producing a deterministic 256-bit digest
   possessing pre-image resistance and avalanche effect properties.
3. Proof-of-Work (PoW) Consensus: Forcing miners to expend computational energy
   by finding a nonce value such that H(header) <= target (matching required leading zeros).
4. Hashrate & Mining Cost Dynamics: Demonstrating exponential computational cost
   scaling with linear increases in mining difficulty.
"""

import hashlib
import json
import time
from typing import Any, Dict, List, Optional


class Block:
    """
    Represents a single block in the blockchain ledger.

    Attributes:
        index (int): The position of the block in the sequence (0 for Genesis).
        timestamp (float): Unix epoch timestamp of block creation.
        transactions (List[Any]): List of transactions contained within the block.
        previous_hash (str): Hexadecimal SHA-256 hash of the preceding block header.
        merkle_root (str): Merkle root hash summarizing all transactions in this block.
        nonce (int): Arbitrary counter incremented during Proof-of-Work mining.
        hash (str): Hexadecimal SHA-256 hash of this block's header.
    """

    def __init__(
        self,
        index: int,
        timestamp: float,
        transactions: List[Any],
        previous_hash: str,
        merkle_root: str = "",
        nonce: int = 0,
        block_hash: str = ""
    ) -> None:
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.merkle_root = merkle_root
        self.nonce = nonce
        self.hash = block_hash if block_hash else self.calculate_hash()

    def calculate_header(self) -> str:
        """
        Serializes block header fields into a canonical JSON string for hashing.

        Concept:
            In Bitcoin, only the 80-byte block header is hashed during mining,
            not the full transaction bodies. The transaction data is bound
            into the header via the Merkle root.
        """
        header_dict = {
            "index": self.index,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce
        }
        return json.dumps(header_dict, sort_keys=True)

    def calculate_hash(self) -> str:
        """
        Computes the SHA-256 cryptographic digest of the block header.

        Returns:
            str: 64-character hexadecimal SHA-256 string.
        """
        header_bytes = self.calculate_header().encode("utf-8")
        return hashlib.sha256(header_bytes).hexdigest()

    def mine_block(self, difficulty: int) -> float:
        """
        Executes Proof-of-Work mining by finding a nonce that yields a hash
        with 'difficulty' leading hexadecimal zero characters.

        Concept:
            Proof-of-Work requires brute-force searching because SHA-256 is
            a one-way function with uniform output distribution. With each
            additional hex zero, the expected hash trials multiply by 16 (2^4).

        Args:
            difficulty (int): The number of leading zeros required in the hex hash.

        Returns:
            float: Elapsed time in seconds to successfully solve the PoW puzzle.
        """
        target_prefix = "0" * difficulty
        start_time = time.perf_counter()
        initial_nonce = self.nonce
        hashes_computed = 0

        while not self.hash.startswith(target_prefix):
            self.nonce += 1
            self.hash = self.calculate_hash()
            hashes_computed += 1

        elapsed_time = time.perf_counter() - start_time
        hashrate = hashes_computed / elapsed_time if elapsed_time > 0 else 0.0

        print(
            f"[MINING COMPLETE] Block #{self.index} | Difficulty: {difficulty} | "
            f"Nonce: {self.nonce} | Hashes: {hashes_computed:,} | "
            f"Time: {elapsed_time:.4f}s | Hashrate: {hashrate:,.1f} H/s | "
            f"Hash: {self.hash}"
        )
        return elapsed_time

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the block instance into a serializable dictionary.
        """
        tx_serialized = []
        for tx in self.transactions:
            if hasattr(tx, "to_dict"):
                tx_serialized.append(tx.to_dict())
            elif isinstance(tx, dict):
                tx_serialized.append(tx)
            else:
                tx_serialized.append(str(tx))

        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": tx_serialized,
            "previous_hash": self.previous_hash,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
            "hash": self.hash
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Block":
        """
        Reconstructs a Block object from a dictionary representation.
        """
        return cls(
            index=data["index"],
            timestamp=data["timestamp"],
            transactions=data.get("transactions", []),
            previous_hash=data["previous_hash"],
            merkle_root=data.get("merkle_root", ""),
            nonce=data.get("nonce", 0),
            block_hash=data.get("hash", "")
        )


def benchmark_mining_difficulties(difficulty_levels: Optional[List[int]] = None) -> List[Dict[str, Any]]:
    """
    Benchmarks and logs the time taken to mine blocks across multiple difficulty levels (2, 3, 4, 5)
    to demonstrate exponential mining cost growth for cryptocurrency coursework analysis.

    Args:
        difficulty_levels: List of difficulty values to evaluate (default: [2, 3, 4, 5]).

    Returns:
        List[Dict[str, Any]]: Results containing difficulty, nonce, time, and hash.
    """
    if difficulty_levels is None:
        difficulty_levels = [2, 3, 4, 5]

    results = []
    print("=" * 72)
    print("PROOF-OF-WORK MINING DIFFICULTY & HASHRATE BENCHMARK")
    print("=" * 72)

    for diff in difficulty_levels:
        dummy_block = Block(
            index=1,
            timestamp=time.time(),
            transactions=["tx_coinbase_reward_50_btc"],
            previous_hash="0000000000000000000000000000000000000000000000000000000000000000",
            merkle_root="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
        elapsed = dummy_block.mine_block(diff)
        results.append({
            "difficulty": diff,
            "nonce": dummy_block.nonce,
            "elapsed_seconds": elapsed,
            "hash": dummy_block.hash
        })

    print("-" * 72)
    print(f"{'Difficulty':<12} | {'Nonce':<12} | {'Time (s)':<14} | {'Result Hash'}")
    print("-" * 72)
    for r in results:
        print(f"{r['difficulty']:<12} | {r['nonce']:<12} | {r['elapsed_seconds']:<14.4f} | {r['hash'][:24]}...")
    print("=" * 72)
    return results
