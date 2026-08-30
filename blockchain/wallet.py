"""
Wallet & ECDSA Cryptography Module - Secp256k1 Digital Signatures.

This module provides:
1. Asymmetric Cryptography: Using public-private key pairs derived via elliptic curve
   scalar multiplication on the secp256k1 curve: Q = d * G.
2. Secp256k1 Curve: Standardized for Bitcoin and Ethereum public-key cryptography.
3. ECDSA Signatures: Generating signature pairs (r, s) and DER encoding.
4. Cryptographic Verification: Validating that signatures match the public key and message digest.
"""

import hashlib
import hmac
import json
import secrets
from typing import Any, Dict, Optional, Tuple, Union

_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
_A = 0
_B = 7
_Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
_Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
_G = (_Gx, _Gy)
_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141


def _inv(k: int, p: int = _P) -> int:
    """Modular inverse using extended Euclidean algorithm."""
    return pow(k, p - 2, p)


def _point_add(p1: Optional[Tuple[int, int]], p2: Optional[Tuple[int, int]]) -> Optional[Tuple[int, int]]:
    """Elliptic curve point addition on secp256k1."""
    if p1 is None:
        return p2
    if p2 is None:
        return p1
    x1, y1 = p1
    x2, y2 = p2
    if x1 == x2 and y1 != y2:
        return None
    if x1 == x2:
        m = (3 * x1 * x1 + _A) * _inv(2 * y1, _P) % _P
    else:
        m = (y2 - y1) * _inv(x2 - x1, _P) % _P
    x3 = (m * m - x1 - x2) % _P
    y3 = (m * (x1 - x3) - y1) % _P
    return (x3, y3)


def _point_mul(k: int, point: Tuple[int, int] = _G) -> Optional[Tuple[int, int]]:
    """Elliptic curve scalar multiplication (double-and-add)."""
    current = point
    result: Optional[Tuple[int, int]] = None
    while k > 0:
        if k & 1:
            result = _point_add(result, current)
        current = _point_add(current, current)
        k >>= 1
    return result


def _der_encode_integer(val: int) -> bytes:
    """Encodes an integer into ASN.1 DER integer format."""
    b = val.to_bytes((val.bit_length() + 7) // 8 or 1, byteorder="big")
    if b[0] & 0x80:
        b = b"\x00" + b
    return bytes([0x02, len(b)]) + b


def _der_encode(r: int, s: int) -> bytes:
    """Encodes (r, s) into ASN.1 DER sequence."""
    rb = _der_encode_integer(r)
    sb = _der_encode_integer(s)
    payload = rb + sb
    return bytes([0x30, len(payload)]) + payload


def _der_decode(der_bytes: bytes) -> Tuple[int, int]:
    """Decodes ASN.1 DER sequence into (r, s)."""
    if len(der_bytes) < 8 or der_bytes[0] != 0x30:
        raise ValueError("Invalid DER header")
    idx = 2
    if der_bytes[idx] != 0x02:
        raise ValueError("Invalid DER r-marker")
    r_len = der_bytes[idx + 1]
    idx += 2
    r = int.from_bytes(der_bytes[idx:idx + r_len], byteorder="big")
    idx += r_len
    if der_bytes[idx] != 0x02:
        raise ValueError("Invalid DER s-marker")
    s_len = der_bytes[idx + 1]
    idx += 2
    s = int.from_bytes(der_bytes[idx:idx + s_len], byteorder="big")
    return (r, s)


def sha256_digest(data: Union[str, bytes]) -> bytes:
    """Computes 32-byte SHA-256 binary digest."""
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).digest()


def serialize_tx_for_signing(tx_data: Any) -> str:
    """Generates a canonical serialized string of transaction data for signing."""
    if hasattr(tx_data, "get_signable_data"):
        return tx_data.get_signable_data()
    if hasattr(tx_data, "to_dict"):
        d = tx_data.to_dict()
        if "inputs" in d and isinstance(d["inputs"], list):
            clean_inputs = []
            for inp in d["inputs"]:
                if isinstance(inp, dict):
                    clean_inp = inp.copy()
                    clean_inp.pop("signature", None)
                    clean_inputs.append(clean_inp)
                else:
                    clean_inputs.append(inp)
            d["inputs"] = clean_inputs
        return json.dumps(d, sort_keys=True)
    if isinstance(tx_data, dict):
        return json.dumps(tx_data, sort_keys=True)
    return str(tx_data)


def generate_key_pair() -> Tuple[str, str, str]:
    """
    Generates a new secp256k1 private key, public key, and wallet address.
    Returns: (private_key_hex, public_key_hex, address)
    """
    priv_int = secrets.randbelow(_N - 1) + 1
    priv_hex = f"{priv_int:064x}"
    
    pub_point = _point_mul(priv_int, _G)
    assert pub_point is not None
    x, y = pub_point
    pub_bytes = b"\x04" + x.to_bytes(32, "big") + y.to_bytes(32, "big")
    pub_hex = pub_bytes.hex()
    
    addr_hash = hashlib.sha256(pub_bytes).hexdigest()
    address = "1" + addr_hash[:32]
    return priv_hex, pub_hex, address


def sign_transaction(private_key_hex: str, transaction_data: Any) -> str:
    """
    Signs transaction data using the private key on secp256k1.
    Returns hex-encoded DER signature.
    """
    serialized = serialize_tx_for_signing(transaction_data)
    message_digest = sha256_digest(serialized)
    z = int.from_bytes(message_digest, "big")
    d = int(private_key_hex, 16)
    
    v = b"\x01" * 32
    k_bytes = b"\x00" * 32
    k_bytes = hmac.new(k_bytes, v + b"\x00" + d.to_bytes(32, "big") + message_digest, hashlib.sha256).digest()
    v = hmac.new(k_bytes, v, hashlib.sha256).digest()
    k_bytes = hmac.new(k_bytes, v + b"\x01" + d.to_bytes(32, "big") + message_digest, hashlib.sha256).digest()
    v = hmac.new(k_bytes, v, hashlib.sha256).digest()
    
    while True:
        v = hmac.new(k_bytes, v, hashlib.sha256).digest()
        k = int.from_bytes(v, "big")
        if 1 <= k < _N:
            point = _point_mul(k, _G)
            if point is None:
                continue
            rx, _ = point
            r = rx % _N
            if r == 0:
                continue
            s = (_inv(k, _N) * (z + r * d)) % _N
            if s == 0:
                continue
            if s > _N // 2:
                s = _N - s
            return _der_encode(r, s).hex()


def verify_signature(public_key_hex: str, transaction_data: Any, signature_hex: str) -> bool:
    """
    Verifies an ECDSA signature against the corresponding public key and transaction data.
    """
    try:
        serialized = serialize_tx_for_signing(transaction_data)
        message_digest = sha256_digest(serialized)
        z = int.from_bytes(message_digest, "big")
        
        pub_bytes = bytes.fromhex(public_key_hex)
        if pub_bytes.startswith(b"\x04"):
            pub_bytes = pub_bytes[1:]
        if len(pub_bytes) != 64:
            return False
        qx = int.from_bytes(pub_bytes[:32], "big")
        qy = int.from_bytes(pub_bytes[32:], "big")
        q = (qx, qy)
        
        if (qy * qy - (qx * qx * qx + _B)) % _P != 0:
            return False
            
        sig_bytes = bytes.fromhex(signature_hex)
        r, s = _der_decode(sig_bytes)
        if not (1 <= r < _N and 1 <= s < _N):
            return False
            
        w = _inv(s, _N)
        u1 = (z * w) % _N
        u2 = (r * w) % _N
        
        p1 = _point_mul(u1, _G)
        p2 = _point_mul(u2, q)
        r_point = _point_add(p1, p2)
        if r_point is None:
            return False
            
        rx, _ = r_point
        return (rx % _N) == r
    except Exception:
        return False


class KeyPair:
    """Represents an asymmetric ECDSA cryptographic identity with private, public, and address components."""
    def __init__(self, private_key_hex: Optional[str] = None) -> None:
        if private_key_hex:
            self.private_key = private_key_hex
            d = int(private_key_hex, 16)
            pub_point = _point_mul(d, _G)
            assert pub_point is not None
            x, y = pub_point
            pub_bytes = b"\x04" + x.to_bytes(32, "big") + y.to_bytes(32, "big")
            self.public_key = pub_bytes.hex()
            addr_hash = hashlib.sha256(pub_bytes).hexdigest()
            self.address = "1" + addr_hash[:32]
        else:
            self.private_key, self.public_key, self.address = generate_key_pair()

    def sign(self, transaction_data: Any) -> str:
        return sign_transaction(self.private_key, transaction_data)

    def verify(self, transaction_data: Any, signature_hex: str) -> bool:
        return verify_signature(self.public_key, transaction_data, signature_hex)

    def to_dict(self, include_private: bool = False) -> Dict[str, str]:
        data = {
            "address": self.address,
            "public_key": self.public_key
        }
        if include_private:
            data["private_key"] = self.private_key
        return data


class Wallet(KeyPair):
    """Wallet representation supporting UTXO balance calculations and transaction creation."""
    def __init__(self, private_key_hex: Optional[str] = None) -> None:
        super().__init__(private_key_hex)

    def get_balance(self, utxo_set: Any) -> float:
        if hasattr(utxo_set, "get_balance_for_address"):
            return utxo_set.get_balance_for_address(self.address)
        if isinstance(utxo_set, dict):
            balance = 0.0
            for utxo in utxo_set.values():
                if getattr(utxo, "recipient", None) == self.address:
                    balance += getattr(utxo, "amount", 0.0)
            return balance
        return 0.0

    def create_transaction(
        self,
        recipient_address: str,
        amount: float,
        utxo_set: Any,
        fee: float = 0.001
    ) -> Any:
        from blockchain.transaction import Transaction, TransactionInput, TransactionOutput
        
        available_utxos = utxo_set.find_spendable_outputs(self.address, amount + fee)
        total_input_amount = sum(u.amount for u in available_utxos)
        
        if total_input_amount < amount + fee:
            raise ValueError(
                f"Insufficient funds: Need {amount + fee:.4f} BTC (including {fee:.4f} fee), "
                f"but only have {total_input_amount:.4f} BTC available."
            )
            
        inputs = [
            TransactionInput(
                previous_tx_id=u.tx_id,
                output_index=u.output_index,
                public_key=self.public_key,
                signature=""
            )
            for u in available_utxos
        ]
        
        outputs = [TransactionOutput(recipient=recipient_address, amount=amount)]
        change = total_input_amount - amount - fee
        if change > 1e-8:
            outputs.append(TransactionOutput(recipient=self.address, amount=change))
            
        tx = Transaction(inputs=inputs, outputs=outputs)
        tx.sign_inputs(self.private_key)
        return tx
