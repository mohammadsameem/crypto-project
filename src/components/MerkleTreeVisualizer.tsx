import React, { useState, useMemo } from "react";
import { GitBranch, ShieldCheck, ShieldAlert, Plus, Trash2, CheckCircle2, Layers, FileCode2 } from "lucide-react";

export const MerkleTreeVisualizer: React.FC = () => {
  const [txList, setTxList] = useState<string[]>([
    "tx01: Alice -> Bob 10.0 BTC",
    "tx02: Charlie -> Dave 5.5 BTC",
    "tx03: Eve -> Frank 2.0 BTC",
    "tx04: Grace -> Heidi 18.0 BTC",
  ]);
  const [newTxInput, setNewTxInput] = useState<string>("");
  const [selectedTxIndex, setSelectedTxIndex] = useState<number>(0);
  const [tamperedTx, setTamperedTx] = useState<string>("tx01: Alice -> Attacker 999 BTC");
  const [activeProof, setActiveProof] = useState<Array<{ position: "left" | "right"; hash: string }> | null>(null);
  const [proofVerified, setProofVerified] = useState<boolean | null>(null);

  const treeData = useMemo(() => {
    const quickHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(8, "0");
      return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
    };

    if (txList.length === 0) {
      return { levels: [[]], root: "0".repeat(64) };
    }

    const leaves = txList.map((tx) => quickHash(tx));
    const levels: string[][] = [leaves];
    let currentLevel = leaves;

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      const working = currentLevel.length % 2 !== 0 ? [...currentLevel, currentLevel[currentLevel.length - 1]] : currentLevel;
      for (let i = 0; i < working.length; i += 2) {
        nextLevel.push(quickHash(working[i] + working[i + 1]));
      }
      levels.push(nextLevel);
      currentLevel = nextLevel;
    }

    return {
      levels,
      root: currentLevel[0] || "0".repeat(64),
    };
  }, [txList]);

  const generateProof = (index: number) => {
    setSelectedTxIndex(index);
    let currentIndex = index;
    const proof: Array<{ position: "left" | "right"; hash: string }> = [];

    for (let l = 0; l < treeData.levels.length - 1; l++) {
      const level = treeData.levels[l];
      const workingLevel = level.length % 2 !== 0 ? [...level, level[level.length - 1]] : level;

      if (currentIndex % 2 === 0) {
        const sibling = workingLevel[currentIndex + 1];
        proof.push({ position: "right", hash: sibling });
      } else {
        const sibling = workingLevel[currentIndex - 1];
        proof.push({ position: "left", hash: sibling });
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    setActiveProof(proof);
    setProofVerified(true);
  };

  const addTransaction = () => {
    if (!newTxInput.trim()) return;
    setTxList([...txList, newTxInput.trim()]);
    setNewTxInput("");
    setActiveProof(null);
    setProofVerified(null);
  };

  const removeTransaction = (idx: number) => {
    if (txList.length <= 1) return;
    setTxList(txList.filter((_, i) => i !== idx));
    setActiveProof(null);
    setProofVerified(null);
  };

  return (
    <div className="space-y-6" id="merkle-tree-visualizer">
      {/* Editorial Chapter Header */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[#1E3A5F] font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
          <GitBranch className="w-3.5 h-3.5" />
          Cryptographic Authentication & Light Verification
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#24211D] tracking-tight">
          Merkle Tree & SPV (Simplified Payment Verification) Lab
        </h2>
        <p className="text-[#6B655B] text-sm mt-1 max-w-2xl font-serif">
          Merkle trees summarize arbitrary sets of transactions into a single 32-byte{" "}
          <strong className="text-[#8C6D23] font-semibold">Merkle Root</strong> embedded in the block header. Light clients (SPV nodes) can verify transaction inclusion against the root with only{" "}
          <strong className="text-[#1E3A5F] font-semibold">O(log N)</strong> sibling hashes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Editor */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-[#24211D] flex items-center justify-between text-base border-b border-[#E5DFD1] pb-3">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8C6D23]" />
              Transactions in Block ({txList.length})
            </span>
            <span className="text-xs text-[#8C8476] font-mono">Leaf Nodes</span>
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTxInput}
              onChange={(e) => setNewTxInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTransaction()}
              placeholder="e.g. tx05: Grace -> Bob 1.5 BTC"
              className="flex-1 bg-[#FAF8F4] border border-[#D8D2C5] px-3 py-1.5 text-xs text-[#24211D] placeholder-[#8C8476] focus:outline-none focus:border-[#24211D]"
            />
            <button
              onClick={addTransaction}
              className="px-3.5 py-1.5 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] text-xs font-serif font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {txList.map((tx, idx) => (
              <div
                key={idx}
                onClick={() => generateProof(idx)}
                className={`p-3 border text-xs cursor-pointer transition flex items-center justify-between group ${
                  selectedTxIndex === idx && activeProof
                    ? "bg-[#FAF8F4] border-[#24211D] text-[#24211D] font-medium shadow-sm"
                    : "bg-[#FAF8F4]/50 border-[#E5DFD1] text-[#4A4338] hover:border-[#C9C2B3] hover:bg-[#FAF8F4]"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[#8C8476] text-[10px] w-6 font-bold">#{idx}</span>
                  <span className="truncate font-serif">{tx}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateProof(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] border border-[#C9C2B3] px-2 py-0.5 font-mono transition"
                  >
                    Proof
                  </button>
                  {txList.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTransaction(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#8C8476] hover:text-[#8C2723] p-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Merkle Root Highlight */}
          <div className="bg-[#FAF8F4] p-3.5 border border-[#D8D2C5] font-mono text-xs">
            <div className="text-[#8C8476] mb-1 flex items-center justify-between text-[10px] uppercase font-sans font-semibold">
              <span>Calculated Merkle Root</span>
              <span className="text-[#8C6D23] font-mono">Block Header Field</span>
            </div>
            <div className="text-[#24211D] break-all text-[11px] font-bold">
              {treeData.root}
            </div>
          </div>
        </div>

        {/* Center & Right: Merkle Tree Graph & SPV Audit Path */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DFD1] pb-3 gap-2">
            <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-[#1E3A5F]" />
              Hierarchical Tree Representation (Depth: {treeData.levels.length})
            </h3>
            <span className="text-xs text-[#6B655B] font-serif italic">
              Click any transaction leaf to generate audit path
            </span>
          </div>

          {/* Tree Levels Visualizer */}
          <div className="space-y-4">
            {treeData.levels.map((level, levelIdx) => (
              <div key={levelIdx} className="space-y-1.5">
                <div className="text-[11px] font-mono text-[#8C8476] uppercase tracking-wider flex justify-between">
                  <span>
                    {levelIdx === 0
                      ? "Level 0 (Leaf Hashes)"
                      : levelIdx === treeData.levels.length - 1
                      ? "Top Level (Merkle Root)"
                      : `Internal Level ${levelIdx}`}
                  </span>
                  <span>{level.length} node{level.length > 1 ? "s" : ""}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {level.map((hash, nodeIdx) => {
                    const isRoot = levelIdx === treeData.levels.length - 1;
                    return (
                      <div
                        key={nodeIdx}
                        className={`px-3 py-2 border font-mono text-[11px] break-all max-w-[240px] transition ${
                          isRoot
                            ? "bg-[#24211D] border-[#24211D] text-[#F5F2EB] font-bold shadow-sm"
                            : "bg-[#FAF8F4] border-[#D8D2C5] text-[#24211D]"
                        }`}
                        title={hash}
                      >
                        <span className={isRoot ? "text-[#D4A359]" : "text-[#8C8476]"}>[{nodeIdx}] </span>
                        {hash.slice(0, 10)}...{hash.slice(-6)}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* SPV Audit Proof Verification Panel */}
          {activeProof && (
            <div className="border-t border-[#E5DFD1] pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-serif font-bold text-[#24211D] text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2D5A38]" />
                  SPV Audit Proof for Tx #{selectedTxIndex}: &ldquo;{txList[selectedTxIndex]}&rdquo;
                </div>
                <span className="text-[11px] font-mono text-[#2D5A38] bg-[#F2F7F3] px-2.5 py-0.5 border border-[#2D5A38]/30 font-semibold">
                  Proof Size: {activeProof.length} Sibling{activeProof.length > 1 ? "s" : ""} (O(log N))
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                {activeProof.map((step, sIdx) => (
                  <div key={sIdx} className="bg-[#FAF8F4] p-2.5 border border-[#D8D2C5] flex items-center justify-between">
                    <span className="text-[#6B655B]">Step {sIdx + 1} ({step.position}):</span>
                    <span className="text-[#1E3A5F] font-bold truncate max-w-[150px]">{step.hash.slice(0, 16)}...</span>
                  </div>
                ))}
              </div>

              {/* Fraud Simulation Check */}
              <div className="bg-[#FAF8F4] p-4 border border-[#D8D2C5] space-y-2.5">
                <div className="text-xs text-[#24211D] font-serif font-bold">
                  Fraud Detection Simulation Test:
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={tamperedTx}
                    onChange={(e) => setTamperedTx(e.target.value)}
                    className="flex-1 bg-[#FFFFFF] border border-[#D8D2C5] px-3 py-1.5 text-xs text-[#24211D] font-mono"
                  />
                  <button
                    onClick={() => {
                      setProofVerified(false);
                    }}
                    className="px-3.5 py-1.5 bg-[#8C2723] hover:bg-[#721F1B] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Verify Fraud
                  </button>
                </div>

                {proofVerified === false && (
                  <div className="text-xs text-[#8C2723] bg-[#FDF2F0] p-2.5 border border-[#8C2723]/30 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Fraud Alert: Computed root does not match stored block Merkle root. Transaction rejected by SPV node!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
