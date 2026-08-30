const hre = require("hardhat");

async function main() {
  console.log("============================================================================");
  console.log("ETHEREUM SMART CONTRACT DEPLOYMENT - VOTING CONTRACT");
  console.log("============================================================================");

  const initialCandidates = [
    "Satoshi Nakamoto",
    "Vitalik Buterin",
    "Hal Finney",
    "Nick Szabo"
  ];

  console.log(`[*] Initial candidate list (${initialCandidates.length}):`, initialCandidates.join(", "));

  const [deployer] = await hre.ethers.getSigners();
  console.log("[*] Deploying from address:", deployer ? deployer.address : "Default Hardhat Account");

  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(initialCandidates);

  await voting.deployed();

  console.log("[+] Voting Contract successfully deployed!");
  console.log("[+] Contract Address :", voting.address);
  if (voting.deployTransaction) {
    console.log("[+] Transaction Hash :", voting.deployTransaction.hash);
    const receipt = await voting.deployTransaction.wait();
    console.log("[+] Gas Used         :", receipt.gasUsed.toString(), "units");
  }
  console.log("============================================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[-] Deployment failed:", error);
    process.exit(1);
  });
