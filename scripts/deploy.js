/**
 * Deployment Script for CredentialRegistry Smart Contract
 * 
 * This script deploys the CredentialRegistry contract to the Sepolia testnet.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.js --network sepolia
 * 
 * After deployment:
 *   1. Save the contract address
 *   2. Update .env with CONTRACT_ADDRESS
 *   3. Backend will use this address to interact with the contract
 */

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log("🚀 Deploying CredentialRegistry Contract to Sepolia...");
  console.log("════════════════════════════════════════════════════════════════\n");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contract with account:", deployer.address);
    console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");

    // Deploy Contract
    console.log("⏳ Deploying CredentialRegistry...");
    const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
    const contract = await CredentialRegistry.deploy();
    
    await contract.deployed();
    console.log("✅ Contract deployed successfully!\n");

    // Display Contract Information
    const contractAddress = contract.address;
    console.log("════════════════════════════════════════════════════════════════");
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Deployer Address: ${deployer.address}`);
    console.log(`Network: Sepolia (ChainID: 11155111)`);
    console.log(`Transaction Hash: ${contract.deployTransaction.hash}`);
    console.log(`Block Number: ${contract.deployTransaction.blockNumber}`);
    console.log("════════════════════════════════════════════════════════════════\n");

    // Save Deployment Info
    const deploymentData = {
      contract: "CredentialRegistry",
      network: "sepolia",
      contractAddress: contractAddress,
      deployerAddress: deployer.address,
      deploymentTimestamp: new Date().toISOString(),
      transactionHash: contract.deployTransaction.hash,
      blockNumber: contract.deployTransaction.blockNumber,
    };

    const deploymentPath = "contracts/deployments/sepolia.json";
    const deploymentDir = "contracts/deployments";
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log(`✅ Deployment info saved to: ${deploymentPath}\n`);

    // Generate Environment Variable Template
    console.log("════════════════════════════════════════════════════════════════");
    console.log("📄 ADD THIS TO YOUR .env FILE:");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`CONTRACT_ADDRESS=${contractAddress}`);
    console.log("════════════════════════════════════════════════════════════════\n");

    // Verify Contract on Etherscan (Optional)
    console.log("⏳ Waiting for block confirmations before verification attempt...");
    await contract.deployTransaction.wait(5);
    
    console.log("📋 Contract ready for Etherscan verification!");
    console.log("   Run: npx hardhat verify --network sepolia " + contractAddress + "\n");

    // Display Useful Commands
    console.log("════════════════════════════════════════════════════════════════");
    console.log("📚 USEFUL COMMANDS:");
    console.log("════════════════════════════════════════════════════════════════");
    console.log(`✓ View on Etherscan:`);
    console.log(`  https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log(`\n✓ Verify on Etherscan:`);
    console.log(`  npx hardhat verify --network sepolia ${contractAddress}`);
    console.log(`\n✓ Query contract balance:`);
    console.log(`  ethers.provider.getBalance("${contractAddress}")`);
    console.log("════════════════════════════════════════════════════════════════\n");

    // Contract Initialization
    console.log("🔧 Contract initialized. Admin address:", deployer.address);
    console.log("✅ Deployment complete!\n");

    process.exit(0);

  } catch (error) {
    console.error("❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  }
}

main();
