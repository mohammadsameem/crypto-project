import React, { useState } from "react";
import { Link2, ShieldCheck, ShieldAlert, Plus, Coins, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface VisualBlock {
  index: number;
  timestamp: string;
  previous_hash: string;
  merkle_root: string;
  nonce: number;
  hash: string;
  transactions: Array<{
    tx_id: string;
    is_coinbase?: boolean;
    inputs: Array<{ tx_id: string; output_index: number }>;
    outputs: Array<{ recipient: string; amount: number }>;
  }>;
  isTampered?: boolean;
}

interface UTXO {
  tx_id: string;
  output_index: number;
  recipient: string;
  amount: number;
}

export const BlockchainLedger: React.FC = () => {
  const [difficulty] = useState<number>(2);

  const initialBlocks: VisualBlock[] = [
    {
      index: 0,
      timestamp: "2009-01-03 18:15:05",
      previous_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      merkle_root: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
      nonce: 2083236893,
      hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
      transactions: [
        {
          tx_id: "genesis_coinbase_tx_00",
          is_coinbase: true,
          inputs: [],
          outputs: [{ recipient: "1SatoshiGenesisAddress0000000000000", amount: 50.0 }],
        },
      ],
    },
    {
      index: 1,
      timestamp: "2026-08-29 16:00:00",
      previous_hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
      merkle_root: "8b7c912048fe019a8234bc89104ef12034981720349182374619283746192834",
      nonce: 142,
      hash: "004a8b29104fe9182374bc910248f10293481720349182374619283746192834",
      transactions: [
        {
          tx_id: "tx_coinbase_block_1",
          is_coinbase: true,
          inputs: [],
          outputs: [{ recipient: "1MinerWalletAddress000000000000000", amount: 50.0 }],
        },
      ],
    },
    {
      index: 2,
      timestamp: "2026-08-29 16:05:00",
      previous_hash: "004a8b29104fe9182374bc910248f10293481720349182374619283746192834",
      merkle_root: "3f9a102938475610293847561029384756102938475610293847561029384756",
      nonce: 89,
      hash: "009c314059182374619283746192837461928374619283746192837461928374",
      transactions: [
        {
          tx_id: "tx_coinbase_block_2",
          is_coinbase: true,
          inputs: [],
          outputs: [{ recipient: "1MinerWalletAddress000000000000000", amount: 50.0 }],
        },
        {
          tx_id: "tx_miner_to_alice",
          is_coinbase: false,
          inputs: [{ tx_id: "tx_coinbase_block_1", output_index: 0 }],
          outputs: [
            { recipient: "1AliceRecipientAddress000000000000", amount: 20.0 },
            { recipient: "1MinerWalletAddress000000000000000", amount: 30.0 },
          ],
        },
      ],
    },
  ];

  const [blocks, setBlocks] = useState<VisualBlock[]>(initialBlocks);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number>(1);
  const [tamperedIdx, setTamperedIdx] = useState<number | null>(null);

  const utxos: UTXO[] = [
    { tx_id: "genesis_coinbase_tx_00", output_index: 0, recipient: "1SatoshiGenesisAddress0000000000000", amount: 50.0 },
    { tx_id: "tx_coinbase_block_2", output_index: 0, recipient: "1MinerWalletAddress000000000000000", amount: 50.0 },
    { tx_id: "tx_miner_to_alice", output_index: 0, recipient: "1AliceRecipientAddress000000000000", amount: 20.0 },
    { tx_id: "tx_miner_to_alice", output_index: 1, recipient: "1MinerWalletAddress000000000000000", amount: 30.0 },
  ];

  const balances = {
    Satoshi: utxos.filter((u) => u.recipient.includes("Satoshi")).reduce((a, b) => a + b.amount, 0),
    Miner: utxos.filter((u) => u.recipient.includes("Miner")).reduce((a, b) => a + b.amount, 0),
    Alice: utxos.filter((u) => u.recipient.includes("Alice")).reduce((a, b) => a + b.amount, 0),
  };

  const tamperBlock = (targetIdx: number) => {
    setTamperedIdx(targetIdx);
    const updated = blocks.map((b, i) => {
      if (i === targetIdx) {
        return {
          ...b,
          isTampered: true,
          merkle_root: "CORRUPTED_ROOT_HASH_999999999999999999999999999999999999999999",
          transactions: [
            ...b.transactions,
            {
              tx_id: "attacker_heist_tx",
              is_coinbase: false,
              inputs: [{ tx_id: "tampered_fake_input", output_index: 0 }],
              outputs: [{ recipient: "1ATTACKER_WALLET_ADDRESS_000000", amount: 9999.0 }],
            },
          ],
        };
      }
      return b;
    });
    setBlocks(updated);
  };

  const resetChain = () => {
    setBlocks(initialBlocks);
    setTamperedIdx(null);
  };

  const mineNextBlock = () => {
    const nextIdx = blocks.length;
    const lastBlock = blocks[blocks.length - 1];
    const newB: VisualBlock = {
      index: nextIdx,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      previous_hash: lastBlock.hash,
      merkle_root: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      nonce: Math.floor(Math.random() * 500) + 10,
      hash: "00" + Math.random().toString(16).substring(2, 64),
      transactions: [
        {
          tx_id: `tx_coinbase_block_${nextIdx}`,
          is_coinbase: true,
          inputs: [],
          outputs: [{ recipient: "1MinerWalletAddress000000000000000", amount: 50.0 }],
        },
      ],
    };
    setBlocks([...blocks, newB]);
    setSelectedBlockIdx(nextIdx);
    confetti({ particleCount: 35, spread: 50 });
  };

  return (
    <div className="space-y-6" id="blockchain-ledger">
      {/* Editorial Chapter Header */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#8C6D23] font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
              <Link2 className="w-3.5 h-3.5" />
              Immutable Append-Only Distributed Ledger
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#24211D] tracking-tight">
              Blockchain Ledger & UTXO State Model
            </h2>
            <p className="text-[#6B655B] text-sm mt-1 max-w-2xl font-serif">
              Blocks form a cryptographic singly-linked chain via <code className="text-[#8C6D23] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">previous_hash</code>.
              Wallets compute balances dynamically by evaluating the global unspent transaction output (UTXO) set.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={mineNextBlock}
              className="px-4 py-2 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] text-xs font-serif font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D4A359]" />
              Mine Next Block
            </button>
            {tamperedIdx !== null && (
              <button
                onClick={resetChain}
                className="px-4 py-2 bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] border border-[#C9C2B3] text-xs font-mono flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#8C6D23]" />
                Restore Pristine Chain
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Balances Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8C8476] font-mono uppercase tracking-wider">Satoshi (Genesis)</div>
            <div className="text-2xl font-serif font-bold text-[#8C6D23] mt-1">{balances.Satoshi.toFixed(2)} <span className="text-xs font-mono text-[#6B655B]">BTC</span></div>
            <div className="text-[11px] text-[#8C8476] font-mono mt-0.5">From 1 UTXO (Genesis)</div>
          </div>
          <Coins className="w-8 h-8 text-[#D4A359]/40" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8C8476] font-mono uppercase tracking-wider">Miner Wallet</div>
            <div className="text-2xl font-serif font-bold text-[#2D5A38] mt-1">{balances.Miner.toFixed(2)} <span className="text-xs font-mono text-[#6B655B]">BTC</span></div>
            <div className="text-[11px] text-[#8C8476] font-mono mt-0.5">From 2 UTXOs (Subsidy + Change)</div>
          </div>
          <Coins className="w-8 h-8 text-[#2D5A38]/30" />
        </div>

        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-[#8C8476] font-mono uppercase tracking-wider">Alice Wallet</div>
            <div className="text-2xl font-serif font-bold text-[#1E3A5F] mt-1">{balances.Alice.toFixed(2)} <span className="text-xs font-mono text-[#6B655B]">BTC</span></div>
            <div className="text-[11px] text-[#8C8476] font-mono mt-0.5">From 1 UTXO Transfer</div>
          </div>
          <Coins className="w-8 h-8 text-[#1E3A5F]/30" />
        </div>
      </div>

      {/* Visual Blockchain Ribbon */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DFD1] pb-3">
          <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#8C6D23]" />
            Confirmed Blocks Sequence ({blocks.length})
          </h3>
          <span className="text-xs font-serif">
            {tamperedIdx === null ? (
              <span className="text-[#2D5A38] flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Chain Valid & Intact
              </span>
            ) : (
              <span className="text-[#8C2723] flex items-center gap-1 font-bold">
                <ShieldAlert className="w-4 h-4" /> Chain Invalidated at Block {tamperedIdx}
              </span>
            )}
          </span>
        </div>

        {/* Chained Blocks Ribbon */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
          {blocks.map((b, idx) => {
            const isInvalidated = tamperedIdx !== null && idx >= tamperedIdx;
            const isSelected = selectedBlockIdx === idx;

            return (
              <React.Fragment key={idx}>
                <div
                  onClick={() => setSelectedBlockIdx(idx)}
                  className={`min-w-[210px] p-4 border cursor-pointer transition flex flex-col justify-between ${
                    isInvalidated
                      ? "bg-[#FDF2F0] border-[#E8C2C0] text-[#8C2723]"
                      : isSelected
                      ? "bg-[#FAF8F4] border-[#24211D] text-[#24211D] shadow-sm"
                      : "bg-[#FAF8F4]/50 border-[#E5DFD1] text-[#4A4338] hover:border-[#C9C2B3] hover:bg-[#FAF8F4]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold">
                      {idx === 0 ? "Block 0 (Genesis)" : `Block ${idx}`}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                        isInvalidated ? "bg-[#8C2723] text-[#F5F2EB] border-[#8C2723]" : "bg-[#EFE9DC] text-[#24211D] border-[#D5CDBD]"
                      }`}
                    >
                      Nonce: {b.nonce}
                    </span>
                  </div>

                  <div className="font-mono text-[10px] space-y-1 mb-3">
                    <div className="text-[#8C8476] truncate">
                      Prev: {b.previous_hash.slice(0, 10)}...
                    </div>
                    <div className={isInvalidated ? "text-[#8C2723] font-bold truncate" : "text-[#2D5A38] font-bold truncate"}>
                      Hash: {b.hash.slice(0, 12)}...
                    </div>
                    <div className="text-[#6B655B] font-serif">
                      {b.transactions.length} Tx{b.transactions.length > 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD1]">
                    <span className="text-[10px] text-[#8C8476] font-mono">{b.timestamp.slice(11, 19)}</span>
                    {idx > 0 && tamperedIdx === null && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          tamperBlock(idx);
                        }}
                        className="text-[10px] text-[#8C2723] hover:text-[#721F1B] font-serif font-bold uppercase underline cursor-pointer"
                      >
                        Tamper
                      </button>
                    )}
                  </div>
                </div>

                {idx < blocks.length - 1 && (
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 ${
                      tamperedIdx !== null && idx >= tamperedIdx ? "text-[#8C2723]" : "text-[#D4A359]"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Block Inspector & UTXO Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Selected Block Details */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5DFD1] pb-3">
            <h3 className="font-serif font-bold text-[#24211D] text-base">
              Block {selectedBlockIdx} Header & Transactions Inspector
            </h3>
            {tamperedIdx === selectedBlockIdx && (
              <span className="text-xs bg-[#8C2723] text-[#F5F2EB] px-2 py-0.5 font-mono font-bold">
                Tampered Block
              </span>
            )}
          </div>

          {blocks[selectedBlockIdx] && (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#FAF8F4] p-3 border border-[#D8D2C5]">
                <span className="text-[#8C8476] block text-[10px] uppercase font-sans font-semibold">Block Hash (SHA-256):</span>
                <span className="text-[#2D5A38] font-bold break-all">{blocks[selectedBlockIdx].hash}</span>
              </div>

              <div className="bg-[#FAF8F4] p-3 border border-[#D8D2C5]">
                <span className="text-[#8C8476] block text-[10px] uppercase font-sans font-semibold">Previous Block Hash Pointer:</span>
                <span className="text-[#24211D] break-all">{blocks[selectedBlockIdx].previous_hash}</span>
              </div>

              <div className="bg-[#FAF8F4] p-3 border border-[#D8D2C5]">
                <span className="text-[#8C8476] block text-[10px] uppercase font-sans font-semibold">Merkle Root Hash:</span>
                <span className="text-[#8C6D23] font-bold break-all">{blocks[selectedBlockIdx].merkle_root}</span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-[#24211D] font-serif font-bold text-xs">
                  Transactions Contained ({blocks[selectedBlockIdx].transactions.length}):
                </div>
                {blocks[selectedBlockIdx].transactions.map((tx, tIdx) => (
                  <div key={tIdx} className="bg-[#FAF8F4] p-3.5 border border-[#E5DFD1] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#1E3A5F] font-bold">{tx.tx_id}</span>
                      {tx.is_coinbase && (
                        <span className="text-[10px] bg-[#EFE9DC] text-[#8C6D23] border border-[#C9C2B3] px-1.5 py-0.5 font-bold">
                          Coinbase Mint
                        </span>
                      )}
                    </div>
                    {tx.outputs.map((out, oIdx) => (
                      <div key={oIdx} className="text-[#4A4338] text-[10px] flex justify-between pl-2 border-l border-[#D8D2C5]">
                        <span className="text-[#6B655B] truncate max-w-[200px]">→ {out.recipient}</span>
                        <span className="text-[#8C6D23] font-bold">{out.amount.toFixed(2)} BTC</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Active UTXO Set (Global Ledger State) */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5DFD1] pb-3">
            <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#8C6D23]" />
              Active UTXO Set (Global Unspent State)
            </h3>
            <span className="text-xs text-[#8C6D23] font-mono font-semibold">{utxos.length} Active Coins</span>
          </div>

          <p className="text-xs text-[#6B655B] font-serif">
            Bitcoin does not maintain mutable account balances. It maintains exclusively unspent transaction outputs (UTXOs).
            When a transaction executes, UTXOs are consumed in their entirety as inputs, and new outputs are minted.
          </p>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {utxos.map((u, uIdx) => (
              <div key={uIdx} className="bg-[#FAF8F4] p-3 border border-[#E5DFD1] font-mono text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8C8476] text-[11px] truncate max-w-[200px]">{u.tx_id}</span>
                  <span className="text-[#8C6D23] font-bold text-sm">+{u.amount.toFixed(2)} BTC</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#6B655B]">
                  <span>Output Index: [{u.output_index}]</span>
                  <span className="text-[#1E3A5F] truncate max-w-[160px]">{u.recipient}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
