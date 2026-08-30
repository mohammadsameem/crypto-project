## Crypto-Project
## From Hash to Contract
A working mini-blockchain built from scratch in Python, paired with a deployed Ethereum smart contract — built to demonstrate the core mechanics of cryptocurrency systems: cryptographic hashing, digital signatures, Proof-of-Work consensus, the UTXO model, and smart contract execution on the EVM.

What this project demonstrates
Most cryptocurrency coursework stays theoretical. This project instead implements the actual mechanics:

Real SHA-256 based Proof-of-Work mining with adjustable difficulty
Real ECDSA (secp256k1) key generation, transaction signing, and signature verification — the same curve used by Bitcoin
A UTXO-based ledger instead of a simple balance counter
Merkle trees for transaction bundling and proof verification
Tamper detection: altering any transaction breaks the hash chain downstream
A genuine Solidity smart contract deployed to the Sepolia testnet and interacted with via web3.py
Real, measured gas costs for contract deployment and execution
Project structure
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
Part A — Bitcoin-style blockchain (Python)
Block structure
Each block contains:

index, timestamp, transactions, previous_hash, merkle_root, nonce, hash
Proof-of-Work
Miners repeatedly vary the nonce and rehash the block header until the resulting hash is below a target difficulty threshold. Difficulty is configurable, and mining time is logged to show the exponential cost increase as difficulty rises.

python blockchain/demo.py --mine --difficulty 4
Wallets & signatures
Wallets generate a real ECDSA key pair on the secp256k1 curve. Transactions are signed with the private key and verified against the public key before being accepted into a block — any tampering invalidates the signature.

UTXO model
Balances are not stored directly. Instead, each wallet's spendable balance is the sum of unspent transaction outputs (UTXOs) it can unlock, mirroring how Bitcoin actually tracks ownership.

Tamper detection
Modifying any transaction inside a mined block changes that block's hash, which breaks the previous_hash link in every subsequent block — demonstrated live in the demo script.

python blockchain/demo.py --tamper --block 3
Merkle proofs
Transactions in a block are hashed into a Merkle tree. A transaction's inclusion in a block can be verified using just its Merkle proof, without needing the full block.

Part B — Ethereum smart contract (Solidity)
Contract: Voting.sol
A decentralized voting contract deployed on the Sepolia testnet, supporting:

Registering candidates
Casting votes (one per address)
Reading live vote tallies
Deployment
Deployed using Hardhat/Remix. Contract address and transaction hash are viewable on Sepolia Etherscan.

Interaction
scripts/interact.py uses web3.py to:

Connect to the deployed contract
Cast a vote
Read updated results
Log the gas cost of each operation (deployment vs. voting vs. reading)
python scripts/interact.py --vote "Candidate A"
Setup
# Clone the repo
git clone https://github.com/mohammadsameem/crypto-project.git
cd from-hash-to-contract

# Install dependencies
pip install -r requirements.txt

# Run the blockchain demo
python blockchain/demo.py

# Interact with the deployed contract (requires .env with RPC URL + private key)
python scripts/interact.py
Requirements
Python 3.9+
ecdsa
web3
Sepolia testnet RPC URL (e.g. from Infura or Alchemy)
A Sepolia test wallet with test ETH (from a faucet)
Demo walkthrough
Mine a block and show PoW timing at increasing difficulty
Tamper with a transaction and show downstream chain invalidation
Sign & verify a transaction using ECDSA
Deploy & vote on the live Sepolia contract
Compare gas costs across contract operations
Disclaimer
This project is for educational purposes only. It runs on a single node with no P2P networking, and the smart contract is deployed to a public testnet using test ETH with no real monetary value.

License
MIT
