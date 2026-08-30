"""
Demo CLI Module - Fundamentals of Cryptocurrency Interactive Demonstrations.

Provides live demonstration commands covering:
1. Proof-of-Work Mining & Hashrate difficulty analysis (--mine --difficulty N)
2. Asymmetric Cryptography & Digital Signature Verification & Tampering (--sign-demo)
3. Merkle Tree Root Calculation & SPV Audit Proofs (--merkle-demo)
4. Blockchain State Validation & Cascading Tamper Invalidation (--tamper --block N)
"""

import argparse
import sys
import time

from blockchain.block import Block, benchmark_mining_difficulties
from blockchain.chain import Blockchain
from blockchain.merkle import MerkleTree
from blockchain.transaction import Transaction, TxInput, TxOutput, Wallet
from blockchain.wallet import KeyPair, generate_key_pair, sign_transaction, verify_signature


def run_mining_demo(difficulty: int) -> None:
    """
    Executes the Proof-of-Work mining demo.
    """
    print("\n" + "=" * 76)
    print("DEMO 1: PROOF-OF-WORK CONSENSUS & DIFFICULTY SCALING")
    print("=" * 76)
    print("Concept: Proof-of-Work prevents Sybil attacks and establishes consensus.")
    print("Miners must find a nonce such that SHA-256(Block Header) has N leading zeros.")
    print("Expected trials scale as 16^N (hexadecimal digits).\n")

    if difficulty is not None:
        print(f"[*] Mining a single sample block at Difficulty = {difficulty}...")
        test_block = Block(
            index=1,
            timestamp=time.time(),
            transactions=["tx_sat_to_hal_50_btc", "tx_hal_to_alice_10_btc"],
            previous_hash="000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
            merkle_root="4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"
        )
        elapsed = test_block.mine_block(difficulty)
        print(f"\n[+] Success! Block mined in {elapsed:.4f} seconds.")
        print(f"[+] Resulting Block Hash : {test_block.hash}")
        print(f"[+] Final Nonce Value    : {test_block.nonce}")
        print(f"[+] Difficulty Match     : Hash starts with {'0' * difficulty}")
    else:
        print("[*] Running multi-difficulty benchmark across levels 2, 3, 4, 5...")
        benchmark_mining_difficulties([2, 3, 4, 5])

    print("=" * 76 + "\n")


def run_sign_demo() -> None:
    """
    Executes the ECDSA cryptographic keypair, signature, and tamper verification demo.
    """
    print("\n" + "=" * 76)
    print("DEMO 2: ASYMMETRIC CRYPTOGRAPHY & ECDSA DIGITAL SIGNATURES")
    print("=" * 76)
    print("Concept: Secp256k1 elliptic curve signatures provide authentication,")
    print("integrity, and non-repudiation without revealing private keys.\n")

    print("[*] Step 1: Generating Secp256k1 Elliptic Curve Key Pair for Alice...")
    alice_keypair = KeyPair()
    print(f"[+] Alice Private Key (Secret) : {alice_keypair.private_key[:16]}...{alice_keypair.private_key[-16:]}")
    print(f"[+] Alice Public Key  (Shared) : {alice_keypair.public_key[:20]}...{alice_keypair.public_key[-20:]}")
    print(f"[+] Alice Address     (Wallet) : {alice_keypair.address}")

    print("\n[*] Step 2: Creating a financial transaction payload...")
    tx_payload = {
        "from": alice_keypair.address,
        "to": "1BOB_RECIPIENT_WALLET_ADDRESS_00",
        "amount": 25.5,
        "fee": 0.001,
        "timestamp": time.time()
    }
    print(f"[+] Transaction Payload: {tx_payload}")

    print("\n[*] Step 3: Alice signs the transaction using her Private Key...")
    signature = alice_keypair.sign(tx_payload)
    print(f"[+] Generated ECDSA Signature (DER format hex):")
    print(f"    {signature}")

    print("\n[*] Step 4: Bob / Network Verifies the Signature with Alice's Public Key...")
    is_valid = alice_keypair.verify(tx_payload, signature)
    print(f"[+] Verification Result : {'VALID (Signature Authenticated)' if is_valid else 'INVALID'}")
    assert is_valid, "Authentic signature verification failed"

    print("\n[*] Step 5: TAMPERING ATTACK - Flipping one byte in the transaction amount (25.5 -> 999.0)...")
    tampered_payload = tx_payload.copy()
    tampered_payload["amount"] = 999.0
    print(f"[!] Tampered Payload: {tampered_payload}")

    tampered_verification = alice_keypair.verify(tampered_payload, signature)
    print(f"[!] Verification Result on Tampered Payload: {'VALID' if tampered_verification else 'FAILED (Attack Detected!)'}")
    assert not tampered_verification, "Tampered payload should fail verification"

    print("\n[*] Step 6: SIGNATURE TAMPERING - Flipping one byte in the signature string itself...")
    tampered_sig_list = list(signature)
    tampered_sig_list[10] = "a" if tampered_sig_list[10] != "a" else "b"
    corrupted_signature = "".join(tampered_sig_list)

    sig_corruption_verification = alice_keypair.verify(tx_payload, corrupted_signature)
    print(f"[!] Verification Result on Corrupted Signature: {'VALID' if sig_corruption_verification else 'FAILED (Tampered Signature Rejected!)'}")
    assert not sig_corruption_verification, "Corrupted signature should fail verification"

    print("\n[+] Cryptographic Proof Complete: Mathematical non-repudiation verified.")
    print("=" * 76 + "\n")


def run_merkle_demo() -> None:
    """
    Executes the Merkle tree construction and SPV audit proof verification demo.
    """
    print("\n" + "=" * 76)
    print("DEMO 3: MERKLE TREE & SPV AUDIT PROOF VERIFICATION")
    print("=" * 76)
    print("Concept: Merkle trees allow logarithmic O(log N) verification of transaction inclusion.")
    print("Light clients verify a transaction using only the sibling audit path.\n")

    transactions = [
        "tx01: Alice -> Bob 10 BTC",
        "tx02: Charlie -> Dave 5 BTC",
        "tx03: Eve -> Frank 2.5 BTC",
        "tx04: Grace -> Heidi 18 BTC"
    ]

    print("[*] Transactions in Block:")
    for idx, tx in enumerate(transactions):
        print(f"    Tx[{idx}]: {tx}")

    tree = MerkleTree(transactions)
    print(f"\n[+] Calculated Merkle Root: {tree.root}")
    print(f"[+] Tree Depth: {len(tree.levels)} levels")

    target_tx = transactions[2]
    print(f"\n[*] Generating SPV Audit Proof for target: '{target_tx}'...")
    proof = tree.get_merkle_proof(target_tx)

    print(f"[+] Audit Proof Path (Length: {len(proof)}):")
    for step in proof:
        print(f"    Position: {step['position']:<5} | Sibling Hash: {step['hash'][:24]}...")

    is_verified = MerkleTree.verify_merkle_proof(target_tx, proof, tree.root)
    print(f"\n[+] SPV Proof Verification: {'VALID (Inclusion Proven)' if is_verified else 'INVALID'}")

    fake_tx = "tx03: Eve -> Attacker 999 BTC"
    fraud_check = MerkleTree.verify_merkle_proof(fake_tx, proof, tree.root)
    print(f"[!] Fraud Verification Test on '{fake_tx}': {'ACCEPTED' if fraud_check else 'REJECTED (Fraud Detected!)'}")

    print("=" * 76 + "\n")


def run_tamper_demo(block_index: int = 1) -> None:
    """
    Executes the blockchain tampering and cascading invalidation demo.
    """
    print("\n" + "=" * 76)
    print("DEMO 4: BLOCKCHAIN IMMUTABILITY & CASCADING TAMPER DETECTION")
    print("=" * 76)
    print("Concept: Block hashes form a cryptographic chain. Tampering with Block N")
    print("breaks its Merkle root and hash, immediately invalidating the entire subsequent chain.\n")

    print("[*] Step 1: Initializing Blockchain and Mining 3 Sequential Blocks...")
    blockchain = Blockchain(difficulty=2, mining_reward=50.0)

    alice = Wallet()
    bob = Wallet()
    miner = Wallet()

    print("\n[*] Mining Block #1...")
    blockchain.mine_pending_transactions(miner.address)
    print(f"[+] Block #1 Hash: {blockchain.chain[1].hash}")
    print(f"[+] Miner Balance: {miner.get_balance(blockchain.utxo_set):.2f} BTC")

    print("\n[*] Miner sends 20 BTC to Alice in Block #2...")
    tx1 = miner.create_transaction(alice.address, 20.0, blockchain.utxo_set)
    blockchain.add_transaction(tx1)
    blockchain.mine_pending_transactions(miner.address)
    print(f"[+] Block #2 Hash: {blockchain.chain[2].hash}")
    print(f"[+] Alice Balance: {alice.get_balance(blockchain.utxo_set):.2f} BTC")

    print("\n[*] Alice sends 8 BTC to Bob in Block #3...")
    tx2 = alice.create_transaction(bob.address, 8.0, blockchain.utxo_set)
    blockchain.add_transaction(tx2)
    blockchain.mine_pending_transactions(miner.address)
    print(f"[+] Block #3 Hash: {blockchain.chain[3].hash}")
    print(f"[+] Bob Balance:   {bob.get_balance(blockchain.utxo_set):.2f} BTC")

    print("\n[*] Step 2: Validating Pristine Blockchain...")
    is_valid, err = blockchain.validate_chain()
    print(f"[+] Pristine Chain Validation Status: {'VALID (All hashes and links intact)' if is_valid else 'INVALID'}")
    assert is_valid, "Pristine chain should be valid"

    target_idx = block_index if block_index < len(blockchain.chain) else 1
    print(f"\n[*] Step 3: TAMPERING ATTACK - Modifying transactions in Block #{target_idx}...")
    blockchain.tamper_block(target_idx, "CORRUPTED_ATTACKER_PAYLOAD")

    print("\n[*] Step 4: Re-running Consensus Chain Validation...")
    tampered_valid, error_msg = blockchain.validate_chain()
    print(f"[!] Tampered Chain Validation Status: {'VALID' if tampered_valid else 'FAILED (Chain Invalidation Detected!)'}")
    print(f"[!] Diagnostic Error Report: {error_msg}")

    print("\n[+] Demonstration Complete: Immutability verified across distributed chain.")
    print("=" * 76 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="From Hash to Contract - Cryptocurrency Fundamentals Interactive CLI Demo"
    )
    parser.add_argument(
        "--mine",
        action="store_true",
        help="Run Proof-of-Work mining demo"
    )
    parser.add_argument(
        "--difficulty",
        type=int,
        default=None,
        help="Specify mining difficulty (leading zeros)"
    )
    parser.add_argument(
        "--sign-demo",
        action="store_true",
        help="Run ECDSA keypair, transaction signing, and tamper test"
    )
    parser.add_argument(
        "--merkle-demo",
        action="store_true",
        help="Run Merkle tree calculation and SPV audit proof demo"
    )
    parser.add_argument(
        "--tamper",
        action="store_true",
        help="Tamper with a block and demonstrate chain invalidation"
    )
    parser.add_argument(
        "--block",
        type=int,
        default=1,
        help="Block index to tamper with (default: 1)"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Run full end-to-end curriculum demonstration suite"
    )

    args = parser.parse_args()

    if len(sys.argv) == 1 or args.all:
        run_mining_demo(args.difficulty)
        run_sign_demo()
        run_merkle_demo()
        run_tamper_demo(args.block)
        return

    if args.mine:
        run_mining_demo(args.difficulty)
    if args.sign_demo:
        run_sign_demo()
    if args.merkle_demo:
        run_merkle_demo()
    if args.tamper:
        run_tamper_demo(args.block)


if __name__ == "__main__":
    main()
