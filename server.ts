import express from "express";
import path from "path";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "From Hash to Contract" });
  });

  app.post("/api/crypto/generate-keys", (req, res) => {
    const script = `import json; from blockchain.wallet import KeyPair; k = KeyPair(); print(json.dumps(k.to_dict(include_private=True)))`;
    exec(`python3 -c '${script}'`, { timeout: 10000, cwd: process.cwd() }, (error, stdout) => {
      if (error) {
        return res.status(500).json({ error: "Failed to generate keys" });
      }
      try {
        const data = JSON.parse(stdout.trim());
        res.json(data);
      } catch (err) {
        res.status(500).json({ error: "Invalid JSON response" });
      }
    });
  });

  app.post("/api/crypto/sign", (req, res) => {
    const { private_key, transaction_data } = req.body;
    if (!private_key || !transaction_data) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const escapedPriv = String(private_key).replace(/[^a-zA-Z0-9]/g, "");
    const jsonPayload = JSON.stringify(transaction_data);
    const script = `import json; from blockchain.wallet import sign_transaction; sig = sign_transaction('${escapedPriv}', ${jsonPayload}); print(sig)`;
    exec(`python3 -c '${script}'`, { timeout: 10000, cwd: process.cwd() }, (error, stdout) => {
      if (error) {
        return res.status(500).json({ error: "Failed to sign transaction" });
      }
      res.json({ signature: stdout.trim() });
    });
  });

  app.post("/api/crypto/verify", (req, res) => {
    const { public_key, transaction_data, signature } = req.body;
    if (!public_key || !transaction_data || !signature) {
      return res.status(400).json({ error: "Missing parameters" });
    }
    const escapedPub = String(public_key).replace(/[^a-zA-Z0-9]/g, "");
    const escapedSig = String(signature).replace(/[^a-zA-Z0-9]/g, "");
    const jsonPayload = JSON.stringify(transaction_data);
    const script = `import json; from blockchain.wallet import verify_signature; valid = verify_signature('${escapedPub}', ${jsonPayload}, '${escapedSig}'); print('VALID' if valid else 'INVALID')`;
    exec(`python3 -c '${script}'`, { timeout: 10000, cwd: process.cwd() }, (error, stdout) => {
      if (error) {
        return res.status(500).json({ error: "Failed to verify signature" });
      }
      const isValid = stdout.trim().includes("VALID");
      res.json({ valid: isValid });
    });
  });

  app.post("/api/run-python", (req, res) => {
    const { command, args } = req.body;
    let allowedCommand = "";

    if (command === "demo") {
      const safeArgs = (args || []).map((a: string) => String(a).replace(/[^a-zA-Z0-9_-]/g, ""));
      allowedCommand = `python3 demo.py ${safeArgs.join(" ")}`;
    } else if (command === "interact") {
      allowedCommand = `python3 scripts/interact.py`;
    } else if (command === "benchmark") {
      allowedCommand = `python3 -c "from blockchain.block import benchmark_mining_difficulties; benchmark_mining_difficulties([2, 3, 4, 5])"`;
    } else {
      return res.status(400).json({ error: "Invalid command specified" });
    }

    exec(allowedCommand, { timeout: 30000, cwd: process.cwd() }, (error, stdout, stderr) => {
      res.json({
        command: allowedCommand,
        success: !error,
        stdout: stdout || "",
        stderr: stderr || "",
        exitCode: error ? error.code : 0,
      });
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`From Hash to Contract server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
