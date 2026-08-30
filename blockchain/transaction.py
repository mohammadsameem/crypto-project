"""
Transaction & UTXO Module - Bitcoin-Style Unspent Transaction Output Model.

This module demonstrates:
1. UTXO (Unspent Transaction Output) Accounting Model:
   Unlike account-based systems (e.g. Ethereum or traditional banks) which store
   explicit account balances, Bitcoin tracks coins as discrete immutable output chunks (UTXOs).
2. Transaction Inputs and Outputs:
   - Inputs (TxInput): Reference and consume existing UTXOs by (tx_id, output_index),
     unlocking them with an ECDSA digital signature and public key.
   - Outputs (TxOutput): Define new spendable coins bound to a recipient address and amount.
3. Change Outputs:
   Because UTXOs must be spent in their entirety, any excess input value over the payment
   amount is returned to the sender as a newly generated change output.
4. Stateless Wallet Balance Calculation:
   The wallet holds no internal "balance" field. Instead, balance is dynamically computed
   by scanning the global UTXO set and summing outputs locked to the wallet's address.
"""

import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple

from blockchain.wallet import KeyPair, sign_transaction, verify_signature


class TxInput:
    """
    Represents an input spending a previously unspent transaction output (UTXO).

    Attributes:
        tx_id (str): Transaction ID of the referenced UTXO.
        output_index (int): Index of the output in the referenced transaction.
        signature (str): ECDSA signature unlocking the referenced UTXO.
        public_key (str): Public key corresponding to the private key that created the signature.
    """

    def __init__(
        self,
        tx_id: str,
        output_index: int,
        signature: str = "",
        public_key: str = ""
    ) -> None:
        self.tx_id = tx_id
        self.output_index = output_index
        self.signature = signature
        self.public_key = public_key

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tx_id": self.tx_id,
            "output_index": self.output_index,
            "signature": self.signature,
            "public_key": self.public_key
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TxInput":
        return cls(
            tx_id=data["tx_id"],
            output_index=data["output_index"],
            signature=data.get("signature", ""),
            public_key=data.get("public_key", "")
        )


class TxOutput:
    """
    Represents a new UTXO created by a transaction.

    Attributes:
        recipient (str): The destination wallet address or public key hash.
        amount (float): The value of cryptocurrency assigned to this output.
    """

    def __init__(self, recipient: str, amount: float) -> None:
        self.recipient = recipient
        self.amount = float(amount)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "recipient": self.recipient,
            "amount": self.amount
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TxOutput":
        return cls(
            recipient=data["recipient"],
            amount=float(data["amount"])
        )


class Transaction:
    """
    Represents a value transfer in the blockchain ledger.

    Attributes:
        inputs (List[TxInput]): Consumed UTXOs.
        outputs (List[TxOutput]): Newly created UTXOs.
        tx_id (str): Unique 32-byte SHA-256 transaction hash identifier.
        is_coinbase (bool): True if this is a block-reward minting transaction with no inputs.
    """

    def __init__(
        self,
        inputs: List[TxInput],
        outputs: List[TxOutput],
        tx_id: str = "",
        is_coinbase: bool = False
    ) -> None:
        self.inputs = inputs
        self.outputs = outputs
        self.is_coinbase = is_coinbase
        self.tx_id = tx_id if tx_id else self.calculate_tx_id()

    def get_signable_data(self) -> str:
        """
        Extracts the canonical data payload for signature verification (excluding existing signatures).
        """
        payload = {
            "is_coinbase": self.is_coinbase,
            "inputs": [
                {"tx_id": inp.tx_id, "output_index": inp.output_index}
                for inp in self.inputs
            ],
            "outputs": [out.to_dict() for out in self.outputs]
        }
        return json.dumps(payload, sort_keys=True)

    def calculate_tx_id(self) -> str:
        """
        Calculates the SHA-256 hash of the transaction structure.
        """
        canonical_str = self.get_signable_data()
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def sign_inputs(self, key_pair: KeyPair) -> None:
        """
        Generates ECDSA digital signatures for each input referencing UTXOs owned by key_pair.
        """
        if self.is_coinbase:
            return

        for inp in self.inputs:
            inp.public_key = key_pair.public_key
            inp.signature = key_pair.sign(self)

    def verify_signatures(self, utxo_set: Dict[Tuple[str, int], TxOutput]) -> bool:
        """
        Verifies that every input has a valid ECDSA signature corresponding to the owner
        of the referenced UTXO.

        Concept:
            Cryptographic proof that only the legitimate owner possessing the private key
            can authorize spending referenced funds.
        """
        if self.is_coinbase:
            return True

        for inp in self.inputs:
            utxo_key = (inp.tx_id, inp.output_index)
            if utxo_key not in utxo_set:
                return False

            referenced_output = utxo_set[utxo_key]

            pub_bytes = bytes.fromhex(inp.public_key)
            addr_hash = hashlib.sha256(pub_bytes).hexdigest()
            derived_addr = "1" + addr_hash[:32]

            if derived_addr != referenced_output.recipient and inp.public_key != referenced_output.recipient:
                return False

            if not verify_signature(inp.public_key, self, inp.signature):
                return False

        return True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tx_id": self.tx_id,
            "is_coinbase": self.is_coinbase,
            "inputs": [inp.to_dict() for inp in self.inputs],
            "outputs": [out.to_dict() for out in self.outputs]
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Transaction":
        inputs = [TxInput.from_dict(i) for i in data.get("inputs", [])]
        outputs = [TxOutput.from_dict(o) for o in data.get("outputs", [])]
        return cls(
            inputs=inputs,
            outputs=outputs,
            tx_id=data.get("tx_id", ""),
            is_coinbase=data.get("is_coinbase", False)
        )

    @classmethod
    def create_coinbase_tx(cls, recipient_address: str, amount: float = 50.0) -> "Transaction":
        """
        Creates a coinbase transaction generating new coins from thin air as a mining subsidy.
        """
        coinbase_input = TxInput(
            tx_id="0000000000000000000000000000000000000000000000000000000000000000",
            output_index=0,
            signature="COINBASE_SUBSIDY_PROOF_OF_WORK",
            public_key="00"
        )
        coinbase_output = TxOutput(recipient=recipient_address, amount=amount)
        tx = cls(
            inputs=[coinbase_input],
            outputs=[coinbase_output],
            is_coinbase=True
        )
        return tx


class Wallet:
    """
    A Cryptocurrency Wallet managing asymmetric ECDSA keys and interacting with the UTXO set.

    Concept:
        The wallet DOES NOT store a balance number. It stores only cryptographic keys.
        Balance is calculated on-demand by aggregating all UTXOs in the blockchain that
        can be unlocked with this wallet's address.
    """

    def __init__(self, key_pair: Optional[KeyPair] = None) -> None:
        self.key_pair = key_pair if key_pair else KeyPair()
        self.address = self.key_pair.address
        self.public_key = self.key_pair.public_key
        self.private_key = self.key_pair.private_key

    def get_utxos(self, utxo_set: Dict[Tuple[str, int], TxOutput]) -> List[Tuple[str, int, TxOutput]]:
        """
        Scans the global UTXO set for all unspent outputs belonging to this wallet.

        Returns:
            List[Tuple[str, int, TxOutput]]: List of (tx_id, output_index, TxOutput)
        """
        my_utxos = []
        for (tx_id, out_idx), output in utxo_set.items():
            if output.recipient == self.address:
                my_utxos.append((tx_id, out_idx, output))
        return my_utxos

    def get_balance(self, utxo_set: Dict[Tuple[str, int], TxOutput]) -> float:
        """
        Calculates wallet balance by summing value of all accessible UTXOs.
        Demonstrates the fundamental UTXO accounting principle.
        """
        my_utxos = self.get_utxos(utxo_set)
        return sum(out.amount for _, _, out in my_utxos)

    def create_transaction(
        self,
        recipient_address: str,
        amount: float,
        utxo_set: Dict[Tuple[str, int], TxOutput]
    ) -> Transaction:
        """
        Constructs and signs a new UTXO transaction with change output calculation.

        Concept:
            1. Select UTXOs until sum >= amount (Coin Selection).
            2. Build TxInputs referencing each selected UTXO.
            3. Build TxOutputs:
               - Payment output: amount -> recipient_address
               - Change output: (total_input - amount) -> self.address
            4. Digitally sign each input with this wallet's private key.

        Args:
            recipient_address: Target destination address.
            amount: Value to transfer.
            utxo_set: Current active unspent outputs on the blockchain.

        Returns:
            Transaction: Valid signed transaction ready for mempool broadcast.
        """
        my_utxos = self.get_utxos(utxo_set)
        accumulated = 0.0
        selected_utxos: List[Tuple[str, int, TxOutput]] = []

        for tx_id, out_idx, utxo in my_utxos:
            selected_utxos.append((tx_id, out_idx, utxo))
            accumulated += utxo.amount
            if accumulated >= amount:
                break

        if accumulated < amount:
            raise ValueError(
                f"Insufficient funds: Wallet balance is {accumulated:.4f} BTC, "
                f"but tried to send {amount:.4f} BTC"
            )

        inputs = [
            TxInput(tx_id=tx_id, output_index=out_idx)
            for tx_id, out_idx, _ in selected_utxos
        ]

        outputs = [TxOutput(recipient=recipient_address, amount=amount)]
        change = accumulated - amount
        if change > 0.00000001:
            outputs.append(TxOutput(recipient=self.address, amount=change))

        tx = Transaction(inputs=inputs, outputs=outputs, is_coinbase=False)

        tx.sign_inputs(self.key_pair)
        return tx

    def to_dict(self) -> Dict[str, str]:
        return {
            "address": self.address,
            "public_key": self.public_key,
            "private_key": self.private_key
        }
