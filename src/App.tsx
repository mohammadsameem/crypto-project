import React, { useState } from "react";
import {
  Cpu,
  GitBranch,
  Key,
  Link2,
  Vote,
  Terminal,
  BookOpen,
  Scroll,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PoWMiningLab } from "./components/PoWMiningLab";
import { MerkleTreeVisualizer } from "./components/MerkleTreeVisualizer";
import { EcdsaLab } from "./components/EcdsaLab";
import { BlockchainLedger } from "./components/BlockchainLedger";
import { EthereumVotingPortal } from "./components/EthereumVotingPortal";
import { PythonCliTerminal } from "./components/PythonCliTerminal";
import { ProjectLogo } from "./components/ProjectLogo";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "pow" | "merkle" | "ecdsa" | "chain" | "ethereum" | "terminal"
  >("pow");

  const tabs = [
    { id: "pow", chapter: "01", label: "Proof-of-Work Mining", icon: Cpu, badge: "SHA-256 / PoW" },
    { id: "merkle", chapter: "02", label: "Merkle Trees & SPV", icon: GitBranch, badge: "O(log N) Proofs" },
    { id: "ecdsa", chapter: "03", label: "ECDSA Signatures", icon: Key, badge: "secp256k1" },
    { id: "chain", chapter: "04", label: "UTXO Blockchain", icon: Link2, badge: "Tamper Defense" },
    { id: "ethereum", chapter: "05", label: "Solidity & Gas (Sepolia)", icon: Vote, badge: "Voting.sol" },
    { id: "terminal", chapter: "06", label: "Python CLI Terminal", icon: Terminal, badge: "Live Runtime" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#24211D] flex flex-col font-sans selection:bg-[#24211D] selection:text-[#F5F2EB]">
      {/* Top Editorial Masthead */}
      <header className="border-b border-[#24211D]/15 bg-[#FAF8F4]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <ProjectLogo size={42} className="border border-[#D4A359]/60 shadow-sm" />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#24211D] tracking-tight">
                  From Hash to Contract
                </h1>
              </div>
              <p className="text-[11px] text-[#6B655B] font-serif italic hidden sm:block">
                A Working Mini-Blockchain in Python paired with an Ethereum Sepolia Smart Contract
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-[#EFE9DC] px-3 py-1.5 border border-[#D5CDBD] text-[#4A4338]">
              <span className="w-2 h-2 rounded-full bg-[#2D5A38]" />
              <span>Python 3.10 • Solidity ^0.8.20 • Web3.py</span>
            </div>

            <button
              onClick={() => setActiveTab("terminal")}
              className="px-3.5 py-1.5 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] border border-[#24211D] text-xs font-mono flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <ProjectLogo size={18} className="ring-1 ring-[#D4A359]/60" />
              <Terminal className="w-3.5 h-3.5 text-[#D4A359]" />
              <span className="hidden sm:inline">CLI Demo Terminal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chapter Index Strip */}
      <div className="border-b border-[#24211D]/15 bg-[#EFEBE1]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 sm:gap-1.5 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs transition border cursor-pointer ${
                  isActive
                    ? "bg-[#24211D] text-[#F5F2EB] border-[#24211D] font-semibold shadow-sm"
                    : "bg-[#FAF8F4]/60 text-[#4A4338] border-[#D5CDBD] hover:bg-[#FAF8F4] hover:text-[#24211D]"
                }`}
              >
                <span className={`text-[10px] font-mono font-bold ${isActive ? "text-[#D4A359]" : "text-[#8C8476]"}`}>
                  {tab.chapter}
                </span>
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#F5F2EB]" : "text-[#6B655B]"}`} />
                <span className="whitespace-nowrap font-medium">{tab.label}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 uppercase tracking-wider ${
                    isActive
                      ? "bg-[#3B3630] text-[#D4A359]"
                      : "bg-[#E5DFD1] text-[#6B655B]"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Study & Lab Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {activeTab === "pow" && <PoWMiningLab />}
        {activeTab === "merkle" && <MerkleTreeVisualizer />}
        {activeTab === "ecdsa" && <EcdsaLab />}
        {activeTab === "chain" && <BlockchainLedger />}
        {activeTab === "ethereum" && <EthereumVotingPortal />}
        {activeTab === "terminal" && <PythonCliTerminal />}
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-[#24211D]/15 bg-[#FAF8F4] py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B655B]">
          <div className="flex items-center gap-2.5 font-serif">
            <ProjectLogo size={24} className="border border-[#D4A359]/50 shadow-xs" />
            <span className="text-[#24211D] font-bold">From Hash to Contract</span>
            <span>—</span>
            <span className="italic">Cryptocurrency Cryptography & Smart Contract Lab Treatise</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#8C8476]">
            <span>Secp256k1 ECDSA</span>
            <span>•</span>
            <span>SHA-256 Merkle Trees</span>
            <span>•</span>
            <span>UTXO Validation</span>
            <span>•</span>
            <span>EVM Gas Mechanics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
