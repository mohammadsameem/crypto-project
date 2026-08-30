"""
Merkle Tree Module - Cryptographic Authentication of Transactions.

This module demonstrates:
1. Merkle Tree Construction: Hierarchical binary hash trees where leaf nodes
   are transaction hashes, and parent nodes are hashes of concatenated children.
2. Merkle Root Generation: A single 32-byte cryptographic root fingerprint representing
   the entire set of transactions in a block header.
3. Merkle Audit Proofs: Generating O(log N) authentication paths allowing lightweight
   clients (SPV - Simplified Payment Verification) to verify transaction inclusion
   without downloading the full blockchain.
4. Odd-Leaf Balancing: Adopting the Bitcoin standard of duplicating the last un-paired
   element when a level has an odd number of nodes.
"""

import hashlib
from typing import Any, Dict, List, Optional, Tuple, Union


def hash256(data: Union[str, bytes]) -> str:
    """
    Computes a single SHA-256 hash string for given text or bytes.
    """
    if isinstance(data, str):
        data_bytes = data.encode("utf-8")
    else:
        data_bytes = data
    return hashlib.sha256(data_bytes).hexdigest()


def double_sha256(data: Union[str, bytes]) -> str:
    """
    Computes SHA-256(SHA-256(data)), matching Bitcoin's standard hash256 convention.
    """
    first_pass = hashlib.sha256(data.encode("utf-8") if isinstance(data, str) else data).digest()
    return hashlib.sha256(first_pass).hexdigest()


class MerkleTree:
    """
    Constructs a Merkle Tree from an ordered list of transaction identifiers.

    Attributes:
        transactions (List[str]): Original transaction strings or hashes.
        leaves (List[str]): Initial layer of SHA-256 leaf hashes.
        levels (List[List[str]]): All hierarchical levels from leaves (level 0) up to root.
        root (str): The final top-level 256-bit Merkle root.
    """

    def __init__(self, transactions: List[Any]) -> None:
        if not transactions:
            self.transactions = []
            self.leaves = []
            self.levels = [[]]
            self.root = hash256("")
            return

        self.transactions = [self._normalize_tx(tx) for tx in transactions]
        self.leaves = [hash256(tx) for tx in self.transactions]
        self.levels = [self.leaves]
        self.root = self._build_tree()

    def _normalize_tx(self, tx: Any) -> str:
        """
        Normalizes a transaction object, dict, or string into a consistent hashable string.
        """
        if hasattr(tx, "tx_id"):
            return str(tx.tx_id)
        if hasattr(tx, "to_dict"):
            import json
            return json.dumps(tx.to_dict(), sort_keys=True)
        if isinstance(tx, dict):
            import json
            return json.dumps(tx, sort_keys=True)
        return str(tx)

    def _build_tree(self) -> str:
        """
        Builds the Merkle tree level by level until a single root remains.

        Concept:
            For level k with nodes [N0, N1, N2], if the count is odd, N2 is duplicated
            to form [N0, N1, N2, N2]. Parents are computed as Hash(Left + Right).
        """
        current_level = self.leaves

        while len(current_level) > 1:
            next_level = []
            if len(current_level) % 2 != 0:
                current_level = current_level + [current_level[-1]]

            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1]
                combined_hash = hash256(left + right)
                next_level.append(combined_hash)

            self.levels.append(next_level)
            current_level = next_level

        return current_level[0] if current_level else hash256("")

    def get_merkle_proof(self, tx: Any) -> List[Dict[str, str]]:
        """
        Generates an audit proof (Merkle branch) for a specific transaction.
        """
        norm_tx = self._normalize_tx(tx)
        target_hash = hash256(norm_tx)

        if target_hash not in self.leaves:
            raise ValueError(f"Transaction not found in Merkle Tree: {norm_tx}")

        index = self.leaves.index(target_hash)
        proof: List[Dict[str, str]] = []

        for level in self.levels[:-1]:
            working_level = level if len(level) % 2 == 0 else level + [level[-1]]

            if index % 2 == 0:
                sibling_index = index + 1
                proof.append({"position": "right", "hash": working_level[sibling_index]})
            else:
                sibling_index = index - 1
                proof.append({"position": "left", "hash": working_level[sibling_index]})

            index = index // 2

        return proof

    @staticmethod
    def verify_merkle_proof(tx: Any, proof: List[Dict[str, str]], root: str) -> bool:
        """
        Verifies whether a transaction is part of a block by reconstructing the
        Merkle root using only the transaction and its audit proof.

        Concept:
            Starting with Hash(tx), we iteratively hash with sibling nodes from the proof.
            If the final computed hash equals the block's Merkle root, the transaction
            is cryptographically proven to be in the block without examining any
            other transactions.

        Args:
            tx: The transaction to verify.
            proof: The list of sibling hash dictionaries ({'position': 'left'|'right', 'hash': '...'}).
            root: The expected Merkle root from the block header.

        Returns:
            bool: True if proof is cryptographically valid, False otherwise.
        """
        if hasattr(tx, "tx_id"):
            norm_tx = str(tx.tx_id)
        elif hasattr(tx, "to_dict"):
            import json
            norm_tx = json.dumps(tx.to_dict(), sort_keys=True)
        elif isinstance(tx, dict):
            import json
            norm_tx = json.dumps(tx, sort_keys=True)
        else:
            norm_tx = str(tx)

        current_hash = hash256(norm_tx)

        for step in proof:
            sibling_hash = step["hash"]
            position = step["position"]

            if position == "right":
                current_hash = hash256(current_hash + sibling_hash)
            elif position == "left":
                current_hash = hash256(sibling_hash + current_hash)
            else:
                raise ValueError(f"Invalid proof position identifier: {position}")

        return current_hash == root

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the Merkle tree state for inspection and visualization.
        """
        return {
            "transactions": self.transactions,
            "leaves": self.leaves,
            "levels": self.levels,
            "root": self.root
        }
