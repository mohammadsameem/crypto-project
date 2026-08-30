import React, { useState } from "react";
import { Terminal, Play, Copy, Check, Sparkles, Cpu, Key, GitBranch, ShieldAlert, FileCode2, Layers } from "lucide-react";
import { ProjectLogo } from "./ProjectLogo";

export const PythonCliTerminal: React.FC = () => {
  const [terminalOutput, setTerminalOutput] = useState<string>(
    "============================================================================\n" +
    "FROM HASH TO CONTRACT - INTERACTIVE PYTHON RUNTIME\n" +
    "Select a demonstration command above to execute directly in the container.\n" +
    "============================================================================"
  );
  const [activeCommand, setActiveCommand] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customDiff, setCustomDiff] = useState<number>(3);
  const [customBlock, setCustomBlock] = useState<number>(1);

  const runCommand = async (type: "demo" | "interact", args: string[]) => {
    setIsRunning(true);
    const displayCmd = type === "demo" ? `python3 demo.py ${args.join(" ")}` : `python3 scripts/interact.py`;
    setActiveCommand(displayCmd);
    setTerminalOutput(`$ ${displayCmd}\n[Running execution in container sandbox...]`);

    try {
      const res = await fetch("/api/run-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: type, args }),
      });
      const data = await res.json();
      const output = (data.stdout || "") + (data.stderr ? `\n[STDERR]:\n${data.stderr}` : "");
      setTerminalOutput(`$ ${displayCmd}\n\n${output}`);
    } catch (err: any) {
      setTerminalOutput(`$ ${displayCmd}\n\n[Error executing command]: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="python-cli-terminal">
      {/* Editorial Chapter Header */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <ProjectLogo size={48} className="border border-[#D4A359]/60 shadow-sm hidden sm:inline-flex" />
            <div>
              <div className="flex items-center gap-2 text-[#8C6D23] font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
                <Terminal className="w-3.5 h-3.5" />
                Direct Container Runtime
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#24211D] tracking-tight">
                Interactive Python CLI & Demonstration Suite
              </h2>
              <p className="text-[#6B655B] text-sm mt-1 max-w-2xl font-serif">
                Trigger real-time executions of <code className="text-[#8C6D23] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">demo.py</code> and{" "}
                <code className="text-[#1E3A5F] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">scripts/interact.py</code> directly inside the Linux container sandbox.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runCommand("demo", ["--all"])}
              disabled={isRunning}
              className="px-4 py-2 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] border border-[#24211D] text-xs font-serif font-bold flex items-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <ProjectLogo size={18} className="ring-1 ring-[#D4A359]/60" />
              <span>Run Full Curriculum (--all)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Commands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Mining Demo */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#8C6D23]">
              <Cpu className="w-3.5 h-3.5" /> PoW Mining
            </div>
            <p className="text-[11px] text-[#6B655B] font-serif mt-1">Mine block at target difficulty level.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#8C8476] font-mono">Diff:</span>
              <input
                type="number"
                min="1"
                max="5"
                value={customDiff}
                onChange={(e) => setCustomDiff(parseInt(e.target.value) || 2)}
                className="w-12 bg-[#FAF8F4] border border-[#D8D2C5] px-1.5 py-0.5 text-xs text-[#8C6D23] font-mono text-center font-bold"
              />
            </div>
            <button
              onClick={() => runCommand("demo", ["--mine", "--difficulty", String(customDiff)])}
              disabled={isRunning}
              className="w-full py-1.5 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-[#D4A359]" />
              Run Mining
            </button>
          </div>
        </div>

        {/* 2. Signature Demo */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#2D5A38]">
              <Key className="w-3.5 h-3.5" /> ECDSA Signatures
            </div>
            <p className="text-[11px] text-[#6B655B] font-serif mt-1">Keypair generation & tamper test.</p>
          </div>
          <button
            onClick={() => runCommand("demo", ["--sign-demo"])}
            disabled={isRunning}
            className="w-full py-1.5 bg-[#2D5A38] hover:bg-[#23472c] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            Run Sign Demo
          </button>
        </div>

        {/* 3. Merkle Demo */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#1E3A5F]">
              <GitBranch className="w-3.5 h-3.5" /> Merkle Tree & SPV
            </div>
            <p className="text-[11px] text-[#6B655B] font-serif mt-1">Audit proofs & verification path.</p>
          </div>
          <button
            onClick={() => runCommand("demo", ["--merkle-demo"])}
            disabled={isRunning}
            className="w-full py-1.5 bg-[#1E3A5F] hover:bg-[#162a45] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            Run Merkle Demo
          </button>
        </div>

        {/* 4. Tamper Demo */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#8C2723]">
              <ShieldAlert className="w-3.5 h-3.5" /> Tamper Chain
            </div>
            <p className="text-[11px] text-[#6B655B] font-serif mt-1">Corrupt block & observe invalidation.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#8C8476] font-mono">Block:</span>
              <input
                type="number"
                min="1"
                max="3"
                value={customBlock}
                onChange={(e) => setCustomBlock(parseInt(e.target.value) || 1)}
                className="w-12 bg-[#FAF8F4] border border-[#D8D2C5] px-1.5 py-0.5 text-xs text-[#8C2723] font-mono text-center font-bold"
              />
            </div>
            <button
              onClick={() => runCommand("demo", ["--tamper", "--block", String(customBlock)])}
              disabled={isRunning}
              className="w-full py-1.5 bg-[#8C2723] hover:bg-[#721F1B] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              Run Tamper Test
            </button>
          </div>
        </div>

        {/* 5. Smart Contract Gas Interact */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-4 flex flex-col justify-between space-y-3 shadow-sm">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#4A4338]">
              <FileCode2 className="w-3.5 h-3.5 text-[#8C6D23]" /> Web3 & Gas Table
            </div>
            <p className="text-[11px] text-[#6B655B] font-serif mt-1">Interact with contract & print gas summary.</p>
          </div>
          <button
            onClick={() => runCommand("interact", [])}
            disabled={isRunning}
            className="w-full py-1.5 bg-[#4A4338] hover:bg-[#3B3630] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current text-[#D4A359]" />
            Run Web3 Gas Test
          </button>
        </div>
      </div>

      {/* Terminal Display */}
      <div className="bg-[#24211D] border border-[#3B3630] overflow-hidden shadow-md">
        {/* Terminal Titlebar */}
        <div className="bg-[#1C1A17] px-4 py-3 border-b border-[#3B3630] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8C2723]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#D4A359]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2D5A38]" />
            </div>
            <ProjectLogo size={18} className="ring-1 ring-[#D4A359]/60 ml-1" />
            <span className="text-xs font-mono text-[#B5ACA0] pl-1">
              bash — python3 {activeCommand ? activeCommand.replace("python3 ", "") : "demo.py"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isRunning && (
              <span className="text-xs font-mono text-[#D4A359] flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#D4A359] animate-ping" /> Executing...
              </span>
            )}
            <button
              onClick={copyToClipboard}
              className="p-1.5 text-[#B5ACA0] hover:text-[#F5F2EB] rounded hover:bg-[#3B3630] transition cursor-pointer"
              title="Copy Terminal Output"
            >
              {copied ? <Check className="w-4 h-4 text-[#2D5A38]" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 font-mono text-xs sm:text-sm text-[#EFEBE1] leading-relaxed overflow-x-auto min-h-[360px] max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text bg-[#171513]">
          {terminalOutput}
        </div>
      </div>
    </div>
  );
};
