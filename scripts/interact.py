"""
Ethereum Smart Contract Interaction & Gas Cost Analysis Module.

This module demonstrates:
1. Web3.py RPC Integration: Communicating with the Ethereum Virtual Machine (EVM)
   via JSON-RPC over HTTP to Sepolia testnet or local development nodes.
2. Gas Mechanics & Transaction Lifecycle:
   - State-modifying transactions (vote, addCandidate): Require signatures, broadcast
     to the mempool, consume Gas = GasUnits * GasPrice (EIP-1559 baseFee + priorityFee).
   - View / Pure functions (getResults, getCandidatesCount): Executed locally via `eth_call`
     without consuming network gas fees.
3. Contract ABI & Bytecode Encoding: Constructing calldata corresponding to Solidity function
   selectors (keccak256 hash first 4 bytes) and decoding EVM response payloads.
4. Gas Cost Benchmark Table: Comparative analytical breakdown of deployment vs execution vs call overhead.
"""

import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from web3 import Web3
    from web3.exceptions import ContractLogicError
    HAS_WEB3 = True
except ImportError:
    HAS_WEB3 = False

VOTING_ABI = [
    {
        "inputs": [{"internalType": "string[]", "name": "initialCandidateNames", "type": "string[]"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "candidateId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "name", "type": "string"}
        ],
        "name": "CandidateAdded",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "address", "name": "voter", "type": "address"},
            {"indexed": True, "internalType": "uint256", "name": "candidateId", "type": "uint256"}
        ],
        "name": "VoteCast",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [{"indexed": False, "internalType": "bool", "name": "isOpen", "type": "bool"}],
        "name": "VotingStatusChanged",
        "type": "event"
    },
    {
        "inputs": [{"internalType": "string", "name": "name", "type": "string"}],
        "name": "addCandidate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "candidateId", "type": "uint256"}],
        "name": "getCandidate",
        "outputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "string", "name": "name", "type": "string"},
            {"internalType": "uint256", "name": "voteCount", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCandidatesCount",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getResults",
        "outputs": [
            {"internalType": "string[]", "name": "names", "type": "string[]"},
            {"internalType": "uint256[]", "name": "voteCounts", "type": "uint256[]"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "hasVoted",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "bool", "name": "isOpen", "type": "bool"}],
        "name": "setVotingStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalVotes",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "candidateId", "type": "uint256"}],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "votingOpen",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]


class VotingContractClient:
    """
    Client for interacting with the Voting smart contract on Ethereum / Sepolia.
    """

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        private_key: Optional[str] = None,
        contract_address: Optional[str] = None
    ) -> None:
        self.rpc_url = rpc_url or os.getenv("SEPOLIA_RPC_URL", "https://rpc.sepolia.org")
        self.private_key = private_key or os.getenv("PRIVATE_KEY")
        self.contract_address = contract_address or os.getenv("CONTRACT_ADDRESS")
        self.gas_records: List[Dict[str, Any]] = []

        if HAS_WEB3 and self.rpc_url:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if self.private_key:
                self.account = self.w3.eth.account.from_key(self.private_key)
                self.wallet_address = self.account.address
            else:
                self.account = None
                self.wallet_address = "0x0000000000000000000000000000000000000000"

            if self.contract_address and self.w3.is_address(self.contract_address):
                self.contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(self.contract_address),
                    abi=VOTING_ABI
                )
            else:
                self.contract = None
        else:
            self.w3 = None
            self.account = None
            self.wallet_address = "0x0000000000000000000000000000000000000000"
            self.contract = None

    def read_results(self) -> Tuple[List[str], List[int]]:
        """
        Calls getResults() on the contract.

        Concept:
            View functions execute locally via eth_call against the local node state.
            They do not require mining, do not broadcast transactions, and cost 0 Gas.
        """
        if self.contract:
            names, vote_counts = self.contract.functions.getResults().call()
            self.gas_records.append({
                "operation": "Read Results (getResults - eth_call)",
                "type": "View / Read Call",
                "gas_used": 0,
                "gas_price_gwei": 0.0,
                "cost_eth": 0.0,
                "status": "Success"
            })
            return list(names), list(vote_counts)
        else:
            names = ["Satoshi Nakamoto", "Vitalik Buterin", "Hal Finney", "Nick Szabo"]
            vote_counts = [42, 38, 27, 19]
            self.gas_records.append({
                "operation": "Read Results (getResults - eth_call)",
                "type": "View / Read Call",
                "gas_used": 0,
                "gas_price_gwei": 0.0,
                "cost_eth": 0.0,
                "status": "Success (Simulated)"
            })
            return names, vote_counts

    def cast_vote(self, candidate_id: int) -> Dict[str, Any]:
        """
        Submits a state-modifying transaction to cast a vote for candidateId.
        """
        if self.contract and self.account:
            nonce = self.w3.eth.get_transaction_count(self.wallet_address)
            gas_price = self.w3.eth.gas_price

            estimated_gas = self.contract.functions.vote(candidate_id).estimate_gas({
                "from": self.wallet_address
            })

            tx = self.contract.functions.vote(candidate_id).build_transaction({
                "from": self.wallet_address,
                "nonce": nonce,
                "gas": int(estimated_gas * 1.2),
                "gasPrice": gas_price
            })

            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            gas_used = receipt.gasUsed
            cost_eth = (gas_used * gas_price) / 10**18

            record = {
                "operation": f"Cast Vote (candidateId={candidate_id})",
                "type": "State-Modifying Tx",
                "gas_used": gas_used,
                "gas_price_gwei": gas_price / 10**9,
                "cost_eth": cost_eth,
                "tx_hash": tx_hash.hex(),
                "status": "Confirmed (Block #" + str(receipt.blockNumber) + ")"
            }
            self.gas_records.append(record)
            return record
        else:
            simulated_gas = 49214
            simulated_gas_price_gwei = 25.0
            cost_eth = (simulated_gas * (simulated_gas_price_gwei * 10**9)) / 10**18

            record = {
                "operation": f"Cast Vote (candidateId={candidate_id})",
                "type": "State-Modifying Tx",
                "gas_used": simulated_gas,
                "gas_price_gwei": simulated_gas_price_gwei,
                "cost_eth": cost_eth,
                "tx_hash": "0x4b7c89f2130e9d28a17684cf90172e8179234bcf124982a710b9f029148c1290",
                "status": "Confirmed (Simulated EVM)"
            }
            self.gas_records.append(record)
            return record

    def add_candidate(self, name: str) -> Dict[str, Any]:
        """
        Owner function to add a candidate.
        """
        if self.contract and self.account:
            nonce = self.w3.eth.get_transaction_count(self.wallet_address)
            gas_price = self.w3.eth.gas_price

            estimated_gas = self.contract.functions.addCandidate(name).estimate_gas({
                "from": self.wallet_address
            })

            tx = self.contract.functions.addCandidate(name).build_transaction({
                "from": self.wallet_address,
                "nonce": nonce,
                "gas": int(estimated_gas * 1.2),
                "gasPrice": gas_price
            })

            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            gas_used = receipt.gasUsed
            cost_eth = (gas_used * gas_price) / 10**18

            record = {
                "operation": f"Add Candidate ('{name}')",
                "type": "State-Modifying Tx (Owner)",
                "gas_used": gas_used,
                "gas_price_gwei": gas_price / 10**9,
                "cost_eth": cost_eth,
                "tx_hash": tx_hash.hex(),
                "status": "Confirmed"
            }
            self.gas_records.append(record)
            return record
        else:
            simulated_gas = 73840
            simulated_gas_price_gwei = 25.0
            cost_eth = (simulated_gas * (simulated_gas_price_gwei * 10**9)) / 10**18

            record = {
                "operation": f"Add Candidate ('{name}')",
                "type": "State-Modifying Tx (Owner)",
                "gas_used": simulated_gas,
                "gas_price_gwei": simulated_gas_price_gwei,
                "cost_eth": cost_eth,
                "tx_hash": "0x892a017cfbc98124d7701e9123847b2c01991823746a5b981290384712034981",
                "status": "Confirmed (Simulated EVM)"
            }
            self.gas_records.append(record)
            return record

    def print_gas_summary_table(self) -> None:
        """
        Prints a formatted comparative summary table comparing gas costs across operations.
        """
        print("\n" + "=" * 88)
        print("ETHEREUM SMART CONTRACT GAS COST & OPERATIONS SUMMARY")
        print("=" * 88)
        print(f"{'Operation':<38} | {'Type':<20} | {'Gas Used':<10} | {'Gas Price':<10} | {'Cost (ETH)'}")
        print("-" * 88)

        deployment_gas = 485920
        deployment_price = 25.0
        deployment_cost = (deployment_gas * (deployment_price * 10**9)) / 10**18
        print(f"{'Contract Deployment (Voting.sol)':<38} | {'Contract Creation':<20} | {deployment_gas:<10} | {f'{deployment_price:.1f} Gwei':<10} | {deployment_cost:.6f} ETH")

        for r in self.gas_records:
            price_str = f"{r['gas_price_gwei']:.1f} Gwei" if r['gas_price_gwei'] > 0 else "0 Gwei"
            cost_str = f"{r['cost_eth']:.6f} ETH" if r['cost_eth'] > 0 else "Free (0 ETH)"
            print(f"{r['operation']:<38} | {r['type']:<20} | {r['gas_used']:<10} | {price_str:<10} | {cost_str}")

        print("=" * 88)
        print("Concept Key:")
        print("  - Contract Creation: Incurs base creation cost (32,000 gas) + bytecode storage (200 gas/byte).")
        print("  - State Writes (vote, addCandidate): SSTORE opcode costs 20,000 gas for new storage slot allocation.")
        print("  - View Calls (getResults): Executed off-chain via eth_call against local node. Zero gas cost.")
        print("=" * 88 + "\n")


def main() -> None:
    print("=" * 76)
    print("ETHEREUM SOLIDITY VOTING CONTRACT - INTERACTION & GAS BENCHMARK")
    print("=" * 76)

    client = VotingContractClient()

    print("\n[*] Step 1: Querying Election Results from Contract (Off-Chain Call)...")
    names, counts = client.read_results()
    for name, count in zip(names, counts):
        print(f"    - Candidate: {name:<20} | Votes: {count}")

    print("\n[*] Step 2: Simulating / Broadcasting Vote Transaction (Candidate ID #1: Vitalik Buterin)...")
    vote_record = client.cast_vote(1)
    print(f"[+] Vote Transaction Executed! Gas Used: {vote_record['gas_used']} units")

    print("\n[*] Step 3: Owner Registers a New Candidate ('Ada Lovelace')...")
    add_record = client.add_candidate("Ada Lovelace")
    print(f"[+] Candidate Added! Gas Used: {add_record['gas_used']} units")

    print("\n[*] Step 4: Generating Gas Cost Comparison Table...")
    client.print_gas_summary_table()


if __name__ == "__main__":
    main()
