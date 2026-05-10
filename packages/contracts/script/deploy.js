const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  console.log("Network:", hre.network.name, "chainId:", network.chainId.toString());
  console.log("Deploying with:", deployer.address);

  const vaultRegistry = await hre.ethers.deployContract("VaultRegistry");
  await vaultRegistry.waitForDeployment();

  const constitutionRegistry = await hre.ethers.deployContract("ConstitutionRegistry");
  await constitutionRegistry.waitForDeployment();

  const executionLog = await hre.ethers.deployContract("ExecutionLog");
  await executionLog.waitForDeployment();

  const vaultRegistryAddr = await vaultRegistry.getAddress();
  const constitutionRegistryAddr = await constitutionRegistry.getAddress();
  const executionLogAddr = await executionLog.getAddress();

  console.log("VaultRegistry:", vaultRegistryAddr);
  console.log("ConstitutionRegistry:", constitutionRegistryAddr);
  console.log("ExecutionLog:", executionLogAddr);

  const record = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    vaultRegistry: vaultRegistryAddr,
    constitutionRegistry: constitutionRegistryAddr,
    executionLog: executionLogAddr,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${hre.network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2), "utf8");
  console.log("\nSaved deployment record:", outFile);

  console.log("\n=== TreasuryOS backend / Railway (minimal on-chain logging) ===");
  console.log("The API only needs ExecutionLog for POST /proposals/.../execution-record.");
  console.log("Set these variables (use MAINNET RPC for mantle mainnet):");
  console.log(`  MANTLE_CHAIN_ID=${record.chainId}`);
  console.log(`  EXECUTION_LOG_CONTRACT=${record.executionLog}`);
  console.log("  MANTLE_RPC_URL=<same RPC you used for deploy, e.g. https://rpc.mantle.xyz>");
  console.log("  TREASURY_EXECUTOR_PRIVATE_KEY=<funded key on this chain>  (or TREASURY_EXECUTOR_MNEMONIC)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
