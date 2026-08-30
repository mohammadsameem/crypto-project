export interface BlockData {
  index: number;
  timestamp: number;
  transactions: any[];
  previous_hash: string;
  merkle_root: string;
  nonce: number;
  hash: string;
}

export interface UTXOItem {
  tx_id: string;
  output_index: number;
  recipient: string;
  amount: number;
}

export interface MerkleProofStep {
  position: "left" | "right";
  hash: string;
}

export interface CandidateItem {
  id: number;
  name: string;
  voteCount: number;
}

export interface GasRecord {
  operation: string;
  type: string;
  gas_used: number;
  gas_price_gwei: number;
  cost_eth: number;
  tx_hash?: string;
  status: string;
}

export interface BenchmarkItem {
  difficulty: number;
  nonce: number;
  elapsed_seconds: number;
  hash: string;
  hashrate: number;
}
