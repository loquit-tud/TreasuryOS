const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const vaultRegistry = await hre.ethers.deployContract("VaultRegistry");
  await vaultRegistry.waitForDeployment();

  const constitutionRegistry = await hre.ethers.deployContract("ConstitutionRegistry");
  await constitutionRegistry.waitForDeployment();

  const executionLog = await hre.ethers.deployContract("ExecutionLog");
  await executionLog.waitForDeployment();

  console.log("VaultRegistry:", await vaultRegistry.getAddress());
  console.log("ConstitutionRegistry:", await constitutionRegistry.getAddress());
  console.log("ExecutionLog:", await executionLog.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
