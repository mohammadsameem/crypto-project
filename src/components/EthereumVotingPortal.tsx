import React, { useState } from "react";
import { Vote, FileCode, CheckCircle2, ShieldCheck, Flame, TrendingDown, Plus, Lock, Unlock, Zap, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

export const EthereumVotingPortal: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: 0, name: "Satoshi Nakamoto", voteCount: 42 },
    { id: 1, name: "Vitalik Buterin", voteCount: 38 },
    { id: 2, name: "Hal Finney", voteCount: 27 },
    { id: 3, name: "Nick Szabo", voteCount: 19 },
  ]);

  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [newCandidateName, setNewCandidateName] = useState<string>("");
  const [votingOpen, setVotingOpen] = useState<boolean>(true);
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(25);
  const [showSolidityCode, setShowSolidityCode] = useState<boolean>(false);
  const [votingMessage, setVotingMessage] = useState<string | null>(null);

  const totalVotes = candidates.reduce((acc, c) => acc + c.voteCount, 0);

  const castVote = (id: number) => {
    if (hasVoted) {
      setVotingMessage("Error: Sender address has already cast a ballot (hasVoted[msg.sender] == true).");
      return;
    }
    if (!votingOpen) {
      setVotingMessage("Error: Voting is currently closed by the contract administrator.");
      return;
    }

    const updated = candidates.map((c) => (c.id === id ? { ...c, voteCount: c.voteCount + 1 } : c));
    setCandidates(updated);
    setHasVoted(true);
    setSelectedCandidate(id);
    setVotingMessage(`Success! Cast vote for candidate ID ${id} on Ethereum Sepolia.`);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  const addCandidate = () => {
    if (!newCandidateName.trim()) return;
    const nextId = candidates.length;
    setCandidates([...candidates, { id: nextId, name: newCandidateName.trim(), voteCount: 0 }]);
    setNewCandidateName("");
  };

  const calculateCostEth = (gasUnits: number) => {
    return ((gasUnits * (gasPriceGwei * 10 ** 9)) / 10 ** 18).toFixed(6);
  };

  return (
    <div className="space-y-6" id="ethereum-voting-portal">
      {/* Editorial Chapter Header */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#1E3A5F] font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
              <Vote className="w-3.5 h-3.5" />
              Ethereum EVM & Solidity Smart Contracts
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#24211D] tracking-tight">
              Decentralized Voting Contract & EVM Gas Cost Analyzer
            </h2>
            <p className="text-[#6B655B] text-sm mt-1 max-w-2xl font-serif">
              Interact with <code className="text-[#1E3A5F] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">Voting.sol</code> compiled for the Ethereum Virtual Machine (EVM).
              Demonstrates state mappings (<code className="text-[#8C6D23] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">hasVoted</code>), access control modifiers, and gas economics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSolidityCode(!showSolidityCode)}
              className="px-4 py-2 bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] border border-[#C9C2B3] text-xs font-mono flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-[#1E3A5F]" />
              {showSolidityCode ? "Hide Solidity Code" : "Inspect Voting.sol"}
            </button>
          </div>
        </div>
      </div>

      {/* Solidity Code Inspector (Collapsible) */}
      {showSolidityCode && (
        <div className="bg-[#24211D] border border-[#3B3630] p-5 font-mono text-xs space-y-2 text-[#F5F2EB] shadow-inner">
          <div className="flex items-center justify-between text-[#B5ACA0] pb-2 border-b border-[#3B3630]">
            <span className="text-[#D4A359] font-bold">contracts/Voting.sol (^0.8.20)</span>
            <span className="text-[10px] text-[#8C8476] uppercase tracking-wider">NatSpec Annotated</span>
          </div>
          <pre className="text-[#EFEBE1] overflow-x-auto p-3 bg-[#171513] border border-[#3B3630] max-h-72 overflow-y-auto leading-relaxed">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;
    struct Candidate { uint256 id; string name; uint256 voteCount; }
    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public voterChoice;
    uint256 public totalVotes;
    bool public votingOpen;

    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    constructor(string[] memory initialCandidateNames) {
        owner = msg.sender;
        votingOpen = true;
        for (uint256 i = 0; i < initialCandidateNames.length; i++) {
            candidates.push(Candidate(i, initialCandidateNames[i], 0));
        }
    }

    function vote(uint256 candidateId) external {
        require(votingOpen, "Voting is closed");
        require(!hasVoted[msg.sender], "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");

        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = candidateId;
        candidates[candidateId].voteCount += 1;
        totalVotes += 1;
        emit VoteCast(msg.sender, candidateId);
    }

    function getResults() external view returns (string[] memory, uint256[] memory) {
        return (candidateNames, voteCounts);
    }
}`}
          </pre>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Ballot */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DFD1] pb-3 gap-2">
            <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2">
              <Vote className="w-4 h-4 text-[#8C6D23]" />
              Live Election Ballot ({totalVotes} Total Votes)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2.5 py-0.5 font-mono text-[10px] font-semibold border ${votingOpen ? "bg-[#F2F7F3] text-[#2D5A38] border-[#2D5A38]/30" : "bg-[#FDF2F0] text-[#8C2723] border-[#8C2723]/30"}`}>
                {votingOpen ? "Voting OPEN" : "Voting CLOSED"}
              </span>
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-3">
            {candidates.map((candidate) => {
              const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0;
              const isChosen = selectedCandidate === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`p-4 border transition ${
                    isChosen
                      ? "bg-[#FAF8F4] border-[#24211D] shadow-sm"
                      : "bg-[#FAF8F4]/50 border-[#E5DFD1] hover:border-[#C9C2B3] hover:bg-[#FAF8F4]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#8C8476] font-bold">ID {candidate.id}</span>
                      <span className="font-serif font-bold text-[#24211D] text-base">{candidate.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#8C6D23] font-bold">
                        {candidate.voteCount} votes ({percentage.toFixed(1)}%)
                      </span>
                      <button
                        onClick={() => castVote(candidate.id)}
                        disabled={hasVoted || !votingOpen}
                        className={`px-3.5 py-1.5 text-xs font-serif font-bold transition shadow-sm cursor-pointer ${
                          isChosen
                            ? "bg-[#2D5A38] text-[#F5F2EB] cursor-default"
                            : hasVoted || !votingOpen
                            ? "bg-[#EFE9DC] text-[#8C8476] cursor-not-allowed border border-[#D8D2C5]"
                            : "bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB]"
                        }`}
                      >
                        {isChosen ? "Voted ✓" : "Cast Vote"}
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#EFE9DC] h-2 overflow-hidden border border-[#D5CDBD]">
                    <div
                      className="bg-[#8C6D23] h-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feedback Message */}
          {votingMessage && (
            <div className={`p-3 text-xs flex items-center gap-2 border ${hasVoted ? "bg-[#F2F7F3] border-[#2D5A38]/40 text-[#2D5A38]" : "bg-[#FDF2F0] border-[#8C2723]/30 text-[#8C2723]"}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-serif">{votingMessage}</span>
            </div>
          )}

          {/* Owner Controls */}
          <div className="border-t border-[#E5DFD1] pt-4 space-y-3">
            <div className="text-xs text-[#24211D] font-serif font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8C6D23]" />
                Contract Owner Administrative Controls
              </span>
              <button
                onClick={() => setVotingOpen(!votingOpen)}
                className="text-[11px] text-[#8C6D23] hover:underline font-mono cursor-pointer"
              >
                Toggle Status ({votingOpen ? "Close" : "Open"})
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="Register new candidate name (e.g. Ada Lovelace)"
                className="flex-1 bg-[#FAF8F4] border border-[#D8D2C5] px-3 py-1.5 text-xs text-[#24211D] font-mono focus:outline-none focus:border-[#24211D]"
              />
              <button
                onClick={addCandidate}
                className="px-3.5 py-1.5 bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] border border-[#C9C2B3] text-xs font-serif font-bold flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Candidate
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: EVM Gas Cost Breakdown Analyzer */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DFD1] pb-3">
              <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#8C6D23]" />
                EVM Gas Cost Analyzer
              </h3>
              <span className="text-xs text-[#8C8476] font-mono">Sepolia Base</span>
            </div>

            {/* Gas Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#6B655B]">Gas Price (Gwei):</span>
                <span className="text-[#8C6D23] font-bold">{gasPriceGwei} Gwei</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={gasPriceGwei}
                onChange={(e) => setGasPriceGwei(parseInt(e.target.value))}
                className="w-full accent-[#8C6D23] bg-[#EFE9DC]"
              />
            </div>

            {/* Comparison Table */}
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-[#FAF8F4] p-3 border border-[#E5DFD1] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6B655B]">Deploy Contract:</span>
                  <span className="text-[#8C6D23] font-bold">{calculateCostEth(485920)} ETH</span>
                </div>
                <div className="text-[10px] text-[#8C8476]">485,920 gas units (Bytecode + init)</div>
              </div>

              <div className="bg-[#FAF8F4] p-3 border border-[#E5DFD1] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6B655B]">Cast Vote (Tx):</span>
                  <span className="text-[#2D5A38] font-bold">{calculateCostEth(49214)} ETH</span>
                </div>
                <div className="text-[10px] text-[#8C8476]">49,214 gas (SSTORE mapping write)</div>
              </div>

              <div className="bg-[#FAF8F4] p-3 border border-[#E5DFD1] space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6B655B]">Add Candidate (Owner):</span>
                  <span className="text-[#1E3A5F] font-bold">{calculateCostEth(73840)} ETH</span>
                </div>
                <div className="text-[10px] text-[#8C8476]">73,840 gas (Dynamic array push)</div>
              </div>

              <div className="bg-[#F2F7F3] p-3 border border-[#2D5A38]/30 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#2D5A38]">Read Results (View):</span>
                  <span className="text-[#2D5A38] font-bold">0.000000 ETH</span>
                </div>
                <div className="text-[10px] text-[#2D5A38]/70">0 gas (Off-chain eth_call)</div>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF8F4] p-3.5 border border-[#D8D2C5] text-[11px] text-[#6B655B] space-y-1 font-serif">
            <div className="text-[#24211D] font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#8C6D23]" /> Key Architectural Concept:
            </div>
            <div>
              Read calls (<code className="text-[#2D5A38] font-mono font-bold">eth_call</code>) execute locally on the node without miners or gas fees.
              State mutations require network consensus and consume EVM gas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
