import React, { useState } from "react";
import { Play, RotateCcw, Cpu, Hash, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import confetti from "canvas-confetti";

export const PoWMiningLab: React.FC = () => {
  const [difficulty, setDifficulty] = useState<number>(3);
  const [nonce, setNonce] = useState<number>(0);
  const [currentHash, setCurrentHash] = useState<string>("0000000000000000000000000000000000000000000000000000000000000000");
  const [isMining, setIsMining] = useState<boolean>(false);
  const [miningResult, setMiningResult] = useState<{
    minedNonce: number;
    minedHash: string;
    elapsedSeconds: number;
    hashesEvaluated: number;
    hashrate: number;
  } | null>(null);

  const [benchmarkData, setBenchmarkData] = useState<Array<{ difficulty: number; timeSec: number; expectedHashes: number }>>([
    { difficulty: 2, timeSec: 0.002, expectedHashes: 256 },
    { difficulty: 3, timeSec: 0.045, expectedHashes: 4096 },
    { difficulty: 4, timeSec: 0.812, expectedHashes: 65536 },
    { difficulty: 5, timeSec: 12.45, expectedHashes: 1048576 },
  ]);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  async function computeSha256(str: string): Promise<string> {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const startMining = async () => {
    setIsMining(true);
    setMiningResult(null);
    const targetPrefix = "0".repeat(difficulty);
    const startTime = performance.now();
    let currentNonce = 0;
    let computedHash = "";
    const headerPrefix = JSON.stringify({
      index: 1,
      timestamp: 1788019200,
      previous_hash: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
      merkle_root: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    });

    const batchSize = 1500;

    const mineBatch = async () => {
      for (let i = 0; i < batchSize; i++) {
        currentNonce++;
        const payload = `${headerPrefix}-${currentNonce}`;
        computedHash = await computeSha256(payload);

        if (computedHash.startsWith(targetPrefix)) {
          const endTime = performance.now();
          const elapsed = (endTime - startTime) / 1000;
          const rate = currentNonce / elapsed;

          setNonce(currentNonce);
          setCurrentHash(computedHash);
          setMiningResult({
            minedNonce: currentNonce,
            minedHash: computedHash,
            elapsedSeconds: elapsed,
            hashesEvaluated: currentNonce,
            hashrate: rate,
          });
          setIsMining(false);
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          return;
        }
      }

      setNonce(currentNonce);
      setCurrentHash(computedHash);

      if (currentNonce < 1500000) {
        requestAnimationFrame(mineBatch);
      } else {
        setIsMining(false);
      }
    };

    mineBatch();
  };

  const runPythonBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await fetch("/api/run-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "benchmark" }),
      });
      const data = await res.json();
      if (data.stdout) {
        const lines = data.stdout.split("\n");
        const parsed: Array<{ difficulty: number; timeSec: number; expectedHashes: number }> = [];
        lines.forEach((line: string) => {
          const match = line.match(/^\s*(\d+)\s+\|\s+(\d+)\s+\|\s+([\d.]+)\s+\|/);
          if (match) {
            const diff = parseInt(match[1]);
            const time = parseFloat(match[3]);
            parsed.push({
              difficulty: diff,
              timeSec: time,
              expectedHashes: Math.pow(16, diff),
            });
          }
        });
        if (parsed.length > 0) {
          setBenchmarkData(parsed);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="space-y-6" id="pow-mining-lab">
      {/* Editorial Chapter Header */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#8C6D23] font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              Consensus Mechanism & Hash Dynamics
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#24211D] tracking-tight">
              Proof-of-Work Mining & Hashrate Scaling Lab
            </h2>
            <p className="text-[#6B655B] text-sm mt-1 max-w-2xl font-serif">
              Miners iteratively increment the <code className="text-[#8C2723] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">nonce</code> scalar in the block
              header until the SHA-256 digest satisfies the target difficulty requirement of{" "}
              <code className="text-[#8C6D23] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">N</code> leading hex zeros.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runPythonBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2 bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] border border-[#C9C2B3] text-xs font-mono flex items-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#8C6D23]" />
              {isBenchmarking ? "Running Benchmark..." : "Run Python Benchmark (Diff 2–5)"}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Mining Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controller & Live Monitor */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DFD1] pb-4 gap-3">
            <h3 className="font-serif font-bold text-base text-[#24211D] flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#8C6D23]" />
              Proof-of-Work Target Parameters
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B655B] font-mono">Difficulty:</span>
              <div className="flex bg-[#F5F2EB] p-1 border border-[#D8D2C5]">
                {[2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d);
                      setMiningResult(null);
                    }}
                    disabled={isMining}
                    className={`px-3 py-1 text-xs font-mono transition cursor-pointer ${
                      difficulty === d
                        ? "bg-[#24211D] text-[#F5F2EB] font-bold shadow-sm"
                        : "text-[#6B655B] hover:text-[#24211D]"
                    }`}
                  >
                    {d} zeros
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Block Header Inspection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-[#FAF8F4] p-3.5 border border-[#E5DFD1]">
              <div className="text-[#8C8476] text-[10px] uppercase tracking-wider mb-1 font-sans font-semibold">Target Prefix</div>
              <div className="text-[#8C6D23] font-bold">
                {"0".repeat(difficulty)}
                <span className="text-[#B5ACA0]">{"f".repeat(64 - difficulty)}</span>
              </div>
            </div>
            <div className="bg-[#FAF8F4] p-3.5 border border-[#E5DFD1]">
              <div className="text-[#8C8476] text-[10px] uppercase tracking-wider mb-1 font-sans font-semibold">Expected Trials (16^{difficulty})</div>
              <div className="text-[#1E3A5F] font-bold">{Math.pow(16, difficulty).toLocaleString()} hashes</div>
            </div>
            <div className="bg-[#FAF8F4] p-3.5 border border-[#E5DFD1]">
              <div className="text-[#8C8476] text-[10px] uppercase tracking-wider mb-1 font-sans font-semibold">Active Nonce Count</div>
              <div className="text-[#2D5A38] font-bold">{nonce.toLocaleString()}</div>
            </div>
          </div>

          {/* Real-time Hash Output Display */}
          <div className="bg-[#24211D] p-5 border border-[#3B3630] font-mono text-white shadow-inner">
            <div className="flex items-center justify-between text-xs text-[#B5ACA0] mb-2 font-mono">
              <span className="uppercase tracking-wider text-[10px]">SHA-256(Block Header + Nonce) Digest:</span>
              <span className={currentHash.startsWith("0".repeat(difficulty)) ? "text-[#5BD47C] font-bold" : "text-[#D4A359]"}>
                {isMining ? "⚡ Mining In Progress..." : currentHash.startsWith("0".repeat(difficulty)) ? "✓ TARGET CONDITION SATISFIED" : "Awaiting Mining Execution"}
              </span>
            </div>
            <div className="text-xs sm:text-sm break-all font-mono p-3.5 bg-[#171513] border border-[#3B3630] text-[#EFEBE1]">
              <span className="text-[#5BD47C] font-bold underline decoration-2">
                {currentHash.slice(0, difficulty)}
              </span>
              <span className="text-[#D8D2C5]">{currentHash.slice(difficulty)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={startMining}
              disabled={isMining}
              className="px-6 py-2.5 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] font-serif font-bold text-sm flex items-center gap-2 border border-[#24211D] shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-[#D4A359]" />
              {isMining ? "Mining in Browser..." : `Mine Block (Difficulty ${difficulty})`}
            </button>

            <button
              onClick={() => {
                setNonce(0);
                setCurrentHash("0000000000000000000000000000000000000000000000000000000000000000");
                setMiningResult(null);
              }}
              disabled={isMining}
              className="px-4 py-2.5 bg-[#FAF8F4] hover:bg-[#EFEBE1] text-[#4A4338] border border-[#D5CDBD] text-xs font-mono flex items-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#6B655B]" />
              Reset Nonce
            </button>
          </div>

          {/* Success Banner */}
          {miningResult && (
            <div className="bg-[#F2F7F3] border border-[#2D5A38]/40 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#2D5A38] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-serif font-bold text-[#2D5A38] text-sm">
                  Block Successfully Solved & Authenticated!
                </div>
                <div className="text-[#3E3A33] font-serif">
                  Found valid nonce <span className="font-mono font-bold text-[#8C6D23]">{miningResult.minedNonce}</span> in{" "}
                  <span className="font-mono font-bold text-[#24211D]">{miningResult.elapsedSeconds.toFixed(4)}s</span> (
                  {miningResult.hashrate.toLocaleString(undefined, { maximumFractionDigits: 0 })} hashes/sec).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Difficulty Scaling Benchmark Chart */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-[#24211D] flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-[#8C6D23]" />
              Mining Time vs Difficulty (16^N)
            </h3>
            <p className="text-xs text-[#6B655B] mt-1 font-serif">
              Empirical demonstration of exponential computational cost growth as target difficulty increments.
            </p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={benchmarkData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD1" />
                <XAxis
                  dataKey="difficulty"
                  stroke="#8C8476"
                  tickFormatter={(val) => `Diff ${val}`}
                  fontSize={11}
                />
                <YAxis stroke="#8C8476" fontSize={11} unit="s" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#FAF8F4", borderColor: "#D8D2C5", borderRadius: "0px", fontSize: "12px", color: "#24211D" }}
                  formatter={(val: any) => [`${val}s`, "Time Elapsed"]}
                  labelFormatter={(label) => `Difficulty: ${label} Leading Zeros`}
                />
                <Line
                  type="monotone"
                  dataKey="timeSec"
                  stroke="#8C6D23"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#24211D", stroke: "#8C6D23" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-[#E5DFD1] pt-3">
            <div className="text-[11px] text-[#6B655B] space-y-1.5 font-mono">
              <div className="flex justify-between border-b border-[#F0EBE1] pb-0.5">
                <span>Diff 2 (256 trials):</span>
                <span className="text-[#24211D] font-bold">~0.002s</span>
              </div>
              <div className="flex justify-between border-b border-[#F0EBE1] pb-0.5">
                <span>Diff 3 (4,096 trials):</span>
                <span className="text-[#24211D] font-bold">~0.045s</span>
              </div>
              <div className="flex justify-between border-b border-[#F0EBE1] pb-0.5">
                <span>Diff 4 (65,536 trials):</span>
                <span className="text-[#24211D] font-bold">~0.812s</span>
              </div>
              <div className="flex justify-between">
                <span>Diff 5 (1,048,576 trials):</span>
                <span className="text-[#8C2723] font-bold">~12.45s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
