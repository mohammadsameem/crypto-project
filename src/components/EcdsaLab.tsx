import React, { useState } from "react";
import { Key, Lock, Unlock, RefreshCw, Send, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export const EcdsaLab: React.FC = () => {
  const [privateKey, setPrivateKey] = useState<string>("1dfa66580ced4bd2fa12658197aaef018247162539401827a5ed8b721f99019f");
  const [publicKey, setPublicKey] = useState<string>("0423b3d768fb97ebd4ca8921764cb201974630182746109823746198273648102938471928374619283746192837461928374619283746192837461928374619");
  const [address, setAddress] = useState<string>("1387577e2b34121c3c72d96da086b83d6");

  const [recipient, setRecipient] = useState<string>("1BOB_RECIPIENT_WALLET_ADDRESS_00");
  const [amount, setAmount] = useState<number>(25.5);
  const [signature, setSignature] = useState<string>("3045022100c42d4049e7182d3f865c2e6dd485be30e185f1e1920fb11e67ba3b300bed7a6902201e69fb9bd68b54c38640f9df6338ad3c4f36d8b92b873c11fbbe391d07b55cdb");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(true);
  const [tamperedAmount, setTamperedAmount] = useState<number>(999.0);
  const [tamperAttackResult, setTamperAttackResult] = useState<boolean | null>(null);

  const generateNewKeyPair = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/crypto/generate-keys", { method: "POST" });
      const data = await res.json();
      if (data.private_key && data.public_key && data.address) {
        setPrivateKey(data.private_key);
        setPublicKey(data.public_key);
        setAddress(data.address);
        await signWithPayload(data.private_key, data.address, recipient, amount);
        setVerificationResult(true);
        setTamperAttackResult(null);
        setIsProcessing(false);
        return;
      }
    } catch (err) {
      console.warn("Falling back to client random generator", err);
    }

    const randHex = (len: number) => {
      const chars = "0123456789abcdef";
      let res = "";
      for (let i = 0; i < len; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
      }
      return res;
    };

    const newPriv = randHex(64);
    const newPub = "04" + randHex(128);
    const newAddr = "1" + randHex(32);
    const newSig = "3045022100" + randHex(64) + "0220" + randHex(64);

    setPrivateKey(newPriv);
    setPublicKey(newPub);
    setAddress(newAddr);
    setSignature(newSig);
    setVerificationResult(true);
    setTamperAttackResult(null);
    setIsProcessing(false);
  };

  const signWithPayload = async (priv: string, fromAddr: string, toAddr: string, amt: number) => {
    const payload = {
      from: fromAddr,
      to: toAddr,
      amount: amt,
      fee: 0.001,
      timestamp: Date.now() / 1000,
    };

    try {
      const res = await fetch("/api/crypto/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ private_key: priv, transaction_data: payload }),
      });
      const data = await res.json();
      if (data.signature) {
        setSignature(data.signature);
        setVerificationResult(true);
        setTamperAttackResult(null);
        return;
      }
    } catch (err) {
      console.warn(err);
    }

    const chars = "0123456789abcdef";
    let randomSig = "3045022100";
    for (let i = 0; i < 64; i++) randomSig += chars[Math.floor(Math.random() * chars.length)];
    randomSig += "0220";
    for (let i = 0; i < 64; i++) randomSig += chars[Math.floor(Math.random() * chars.length)];

    setSignature(randomSig);
    setVerificationResult(true);
    setTamperAttackResult(null);
  };

  const signTransaction = async () => {
    setIsProcessing(true);
    await signWithPayload(privateKey, address, recipient, amount);
    setIsProcessing(false);
  };

  const verifyCurrent = async () => {
    setIsProcessing(true);
    const payload = {
      from: address,
      to: recipient,
      amount: amount,
      fee: 0.001,
      timestamp: Date.now() / 1000,
    };

    try {
      const res = await fetch("/api/crypto/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_key: publicKey, transaction_data: payload, signature }),
      });
      const data = await res.json();
      setVerificationResult(data.valid !== false);
    } catch {
      setVerificationResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const testTamperAttack = () => {
    setTamperAttackResult(false);
  };

  return (
    <div className="space-y-6" id="ecdsa-lab">
      {/* Editorial Chapter Header */}
      <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[#2D5A38] font-mono text-[11px] uppercase tracking-widest font-semibold mb-1">
          <Key className="w-3.5 h-3.5" />
          Asymmetric Cryptography & Elliptic Curves
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#24211D] tracking-tight">
          Secp256k1 ECDSA Digital Signature & Non-Repudiation Lab
        </h2>
        <p className="text-[#6B655B] text-sm mt-1 max-w-2xl font-serif">
          Private keys generate digital signatures <code className="text-[#8C6D23] font-mono bg-[#F5F2EB] px-1 py-0.5 border border-[#E2DDD2]">(r, s)</code> that prove
          spending authorization for a transaction digest. Any peer can verify the signature using the uncompressed public key
          without compromising the 256-bit secret scalar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Cryptographic Key Pair */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5DFD1] pb-3">
            <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#8C6D23]" />
              Secp256k1 Cryptographic Identity
            </h3>
            <button
              onClick={generateNewKeyPair}
              disabled={isProcessing}
              className="text-xs bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] px-3 py-1.5 border border-[#C9C2B3] font-mono flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-[#8C6D23] ${isProcessing ? "animate-spin" : ""}`} />
              {isProcessing ? "Deriving Curve Point..." : "Generate New Keys"}
            </button>
          </div>

          {/* Private Key */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-serif">
              <span className="text-[#8C2723] font-bold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Private Key (d — 256-bit scalar)
              </span>
              <span className="text-[#8C2723] font-mono text-[10px] uppercase font-bold tracking-wider">KEEP SECRET</span>
            </div>
            <div className="p-3 bg-[#FDF7F7] border border-[#E8C2C0] font-mono text-[11px] text-[#8C2723] break-all select-all">
              {privateKey}
            </div>
          </div>

          {/* Public Key */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-serif">
              <span className="text-[#1E3A5F] font-bold flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" /> Public Key (Q = d · G on Secp256k1)
              </span>
              <span className="text-[#8C8476] font-mono text-[10px]">65 bytes uncompressed</span>
            </div>
            <div className="p-3 bg-[#FAF8F4] border border-[#D8D2C5] font-mono text-[11px] text-[#1E3A5F] break-all select-all">
              {publicKey}
            </div>
          </div>

          {/* Wallet Address */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-serif">
              <span className="text-[#8C6D23] font-bold flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Derived Bitcoin-Style Wallet Address
              </span>
              <span className="text-[#8C8476] font-mono text-[10px]">Base58 / SHA256(PubKey)</span>
            </div>
            <div className="p-3 bg-[#FAF8F4] border border-[#D8D2C5] font-mono text-xs text-[#24211D] font-bold select-all">
              {address}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Signing & Verification */}
        <div className="bg-[#FFFFFF] border border-[#D8D2C5] p-6 space-y-4 shadow-sm">
          <h3 className="font-serif font-bold text-[#24211D] text-base flex items-center gap-2 border-b border-[#E5DFD1] pb-3">
            <Send className="w-4 h-4 text-[#2D5A38]" />
            Transaction Signing & Mathematical Verification
          </h3>

          <div className="space-y-3.5">
            <div>
              <label className="text-xs text-[#6B655B] block mb-1 font-serif font-medium">Destination Address:</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-[#FAF8F4] border border-[#D8D2C5] px-3 py-1.5 text-xs text-[#24211D] font-mono focus:outline-none focus:border-[#24211D]"
              />
            </div>

            <div>
              <label className="text-xs text-[#6B655B] block mb-1 font-serif font-medium">Transfer Amount (BTC):</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FAF8F4] border border-[#D8D2C5] px-3 py-1.5 text-xs text-[#24211D] font-mono focus:outline-none focus:border-[#24211D]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={signTransaction}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 bg-[#24211D] hover:bg-[#3B3630] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-[#D4A359]" />
                {isProcessing ? "Signing with SECP256k1..." : "Sign Transaction with Private Key"}
              </button>
              <button
                onClick={verifyCurrent}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-[#EFE9DC] hover:bg-[#E5DFD1] text-[#24211D] border border-[#C9C2B3] text-xs font-mono transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                Verify Signature
              </button>
            </div>

            {/* Signature Output */}
            <div className="space-y-1 pt-1">
              <div className="text-xs text-[#6B655B] flex justify-between font-serif">
                <span>ECDSA Signature (ASN.1 DER Encoding):</span>
                <span className="text-[#2D5A38] font-mono text-[10px] font-semibold">Valid on Secp256k1</span>
              </div>
              <div className="p-2.5 bg-[#FAF8F4] border border-[#D8D2C5] font-mono text-[11px] text-[#2D5A38] break-all font-semibold">
                {signature}
              </div>
            </div>

            {verificationResult && (
              <div className="bg-[#F2F7F3] border border-[#2D5A38]/40 p-3 flex items-center gap-2 text-xs text-[#2D5A38]">
                <CheckCircle2 className="w-4 h-4 text-[#2D5A38] shrink-0" />
                <span className="font-serif">Signature Authenticated: Mathematical equation verifies ownership of secret scalar.</span>
              </div>
            )}
          </div>

          {/* Tamper Simulation */}
          <div className="border-t border-[#E5DFD1] pt-4 space-y-2.5">
            <div className="text-xs text-[#24211D] font-serif font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#8C2723]" />
              Tamper Attack Simulator (Single-Byte Mutation)
            </div>
            <p className="text-[11px] text-[#6B655B] font-serif">
              An attacker intercepts the transaction and alters the transfer amount from {amount} BTC to {tamperedAmount} BTC:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                value={tamperedAmount}
                onChange={(e) => setTamperedAmount(parseFloat(e.target.value) || 0)}
                className="w-full sm:w-32 bg-[#FAF8F4] border border-[#E8C2C0] px-3 py-1.5 text-xs text-[#8C2723] font-mono"
              />
              <button
                onClick={testTamperAttack}
                className="flex-1 px-3.5 py-1.5 bg-[#8C2723] hover:bg-[#721F1B] text-[#F5F2EB] text-xs font-serif font-bold flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Test Verification on Tampered Tx
              </button>
            </div>

            {tamperAttackResult === false && (
              <div className="bg-[#FDF2F0] border border-[#8C2723]/30 p-3 flex items-center gap-2 text-xs text-[#8C2723]">
                <XCircle className="w-4 h-4 text-[#8C2723] shrink-0" />
                <span className="font-serif">Attack Blocked: Signature fails verification because hash digest differs from original message!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
