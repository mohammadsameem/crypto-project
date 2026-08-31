<div align="center">

# From Hash to Contract

**A working mini-blockchain built from scratch in Python, paired with a live Ethereum smart contract on Sepolia.**


[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.19-363636.svg)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network](https://img.shields.io/badge/Network-Sepolia%20Testnet-purple.svg)](https://sepolia.etherscan.io/)

</div>

---

## Why this project

Most cryptocurrency coursework stays theoretical — diagrams of what a blockchain *is*, without ever building one. This project takes the opposite approach: every core concept from the course is implemented as working, runnable code.

| Concept | Where it lives |
|---|---|
| SHA-256 hashing & Proof-of-Work | `blockchain/block.py` |
| ECDSA (secp256k1) signatures | `blockchain/wallet.py` |
| Merkle trees & proofs | `blockchain/merkle.py` |
| UTXO-based ledger | `blockchain/transaction.py` |
| Chain validation & tamper detection | `blockchain/chain.py` |
| Smart contracts & gas mechanics | `contracts/Voting.sol`, `scripts/interact.py` |

---

## What it actually does

- ⛏️ **Mines real blocks** using SHA-256 Proof-of-Work with adjustable difficulty, logging how mining time grows exponentially as difficulty increases
- 🔐 **Signs & verifies transactions** using real ECDSA key pairs on the secp256k1 curve — the same curve Bitcoin uses
- 💰 **Tracks balances via UTXOs**, not a simple counter — spendable balance is computed from unspent outputs, exactly like Bitcoin
- 🌳 **Builds Merkle trees** for transaction bundling, with proof generation and verification
- 🛡️ **Detects tampering** — modifying any transaction breaks the hash chain for every block after it
- 📜 **Deploys a real smart contract** (`Voting.sol`) to the Sepolia testnet and interacts with it live via `web3.py`
- ⛽ **Measures real gas costs** for deployment, voting, and reads — actual numbers from a live testnet, not estimates

---

## Project structure

```
from-hash-to-contract/
├── blockchain/
│   ├── block.py          # Block structure, hashing, PoW mining loop
│   ├── merkle.py         # Merkle tree construction + proof verification
│   ├── wallet.py         # ECDSA key generation, signing, verification
│   ├── transaction.py    # UTXO-based transaction logic
│   ├── chain.py          # Chain validation, tamper detection
│   └── demo.py           # CLI demo: mine, tamper, verify
├── contracts/
│   ├── Voting.sol         # Solidity voting contract
│   └── deploy.py          # Deployment script (Hardhat/Remix + web3.py)
├── scripts/
│   └── interact.py       # Cast votes, read results, log gas costs
├── report/
│   └── project_report.pdf
├── requirements.txt
└── README.md
```

---

## Quick start

```bash
# Clone the repo
git clone https://github.com/mohammadsameem/crypto-project.git
cd from-hash-to-contract

# Install dependencies
pip install -r requirements.txt

# Run the blockchain demo
python blockchain/demo.py

# Interact with the deployed contract (requires .env — see below)
python scripts/interact.py
```

### Requirements

- Python 3.9+
- `ecdsa`
- `web3`
- A Sepolia RPC URL (free from [Alchemy](https://alchemy.com) or [Infura](https://infura.io))
- A Sepolia test wallet funded with test ETH from a [faucet](https://sepoliafaucet.com)

### Environment variables

Create a `.env` file in the project root:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
PRIVATE_KEY=your-test-wallet-private-key
CONTRACT_ADDRESS=0x...your-deployed-contract-address
```

⚠️ Use a dedicated test wallet only. Never put a private key holding real funds in a `.env` file.

---

## Part A — Bitcoin-style blockchain

**Block structure**
```
index, timestamp, transactions, previous_hash, merkle_root, nonce, hash
```

**Mine a block:**
```bash
python blockchain/demo.py --mine --difficulty 4
```
Miners repeatedly vary the nonce and rehash the block header until the digest falls below the target difficulty — the same mechanism Bitcoin uses, with mining time logged to show the exponential cost curve.

**See tamper detection in action:**
```bash
python blockchain/demo.py --tamper --block 3
```
Altering any transaction changes that block's hash, breaking the `previous_hash` link in every subsequent block — the chain immediately reports itself as invalid.

**UTXO model:** balances aren't stored directly. A wallet's spendable balance is the sum of unspent transaction outputs (UTXOs) it can unlock — mirroring how Bitcoin actually tracks ownership.

**Merkle proofs:** transactions are hashed into a Merkle tree, so any transaction's inclusion in a block can be verified with just its proof path, without needing the full block.

---

## Part B — Ethereum smart contract

**Contract: `Voting.sol`** — a decentralized voting contract deployed on Sepolia, supporting:
- Registering candidates (owner-only)
- Casting one vote per address
- Reading live vote tallies

**Deployment:** deployed via Remix/Hardhat using an injected MetaMask provider. Contract address and creation transaction are publicly viewable on [Sepolia Etherscan](https://sepolia.etherscan.io).

**Interaction:**
```bash
python scripts/interact.py --vote "Candidate A"
```
`scripts/interact.py` uses `web3.py` to connect to the deployed contract, cast a vote, read updated results, and log the gas cost of each operation — deployment, voting, and reads all measured separately.

---

## Demo walkthrough

1. Mine a block and show PoW timing scale with difficulty
2. Tamper with a transaction and show downstream chain invalidation
3. Sign and verify a transaction with ECDSA
4. Deploy and vote on the live Sepolia contract
5. Compare real gas costs across contract operations

---

## License

MIT
