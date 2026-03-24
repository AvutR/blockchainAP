/**
 * Blockchain Service
 * 
 * Handles all blockchain interactions:
 * - Connect to Sepolia via ethers.js
 * - Register credentials on-chain
 * - Verify credentials from blockchain
 * - Query issuer information
 */

const ethers = require("ethers");

// ABI for CredentialRegistry contract
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "bytes32", "name": "_credentialHash", "type": "bytes32" },
      { "internalType": "string", "name": "_credentialType", "type": "string" }
    ],
    "name": "registerCredential",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_credentialHash", "type": "bytes32" }],
    "name": "verifyCredential",
    "outputs": [{ "internalType": "bool", "name": "isValid", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_credentialHash", "type": "bytes32" }],
    "name": "getIssuer",
    "outputs": [{ "internalType": "address", "name": "issuerAddress", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_credentialHash", "type": "bytes32" }],
    "name": "getCredential",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "issuer", "type": "address" },
          { "internalType": "uint256", "name": "issuedAt", "type": "uint256" },
          { "internalType": "bool", "name": "revoked", "type": "bool" },
          { "internalType": "string", "name": "credentialType", "type": "string" }
        ],
        "internalType": "struct CredentialRegistry.Credential",
        "name": "credential",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "_credentialHash", "type": "bytes32" }],
    "name": "credentialExists",
    "outputs": [{ "internalType": "bool", "name": "exists", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

class BlockchainService {
  
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
  }

  /**
   * Initialize blockchain connection
   * Sets up provider, signer, and contract instance
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const rpcUrl = process.env.SEPOLIA_RPC_URL;
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const privateKey = process.env.PRIVATE_KEY;

      if (!rpcUrl) throw new Error("SEPOLIA_RPC_URL not set in environment");
      if (!contractAddress) throw new Error("CONTRACT_ADDRESS not set in environment");
      if (!privateKey) throw new Error("PRIVATE_KEY not set in environment");

      // Create provider (read-only)
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);

      // Create signer (for transactions)
      this.signer = new ethers.Wallet(privateKey, this.provider);

      // Create contract instance
      this.contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        this.signer
      );

      console.log("[BlockchainService] ✅ Connected to Sepolia");
      console.log("[BlockchainService] Contract Address:", contractAddress);
      console.log("[BlockchainService] Signer Address:", this.signer.address);

      return true;
    } catch (error) {
      console.error("[BlockchainService] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Register credential hash on-chain
   * 
   * @param {string} credentialHash - Keccak256 hash of credential
   * @param {string} credentialType - Type of credential
   * @returns {Promise<Object>} Transaction receipt
   */
  async registerOnChain(credentialHash, credentialType) {
    try {
      if (!this.contract) await this.initialize();

      console.log("[BlockchainService] 📝 Registering credential on-chain...");
      console.log("  Hash:", credentialHash);
      console.log("  Type:", credentialType);

      // Send transaction
      const tx = await this.contract.registerCredential(credentialHash, credentialType);
      console.log("[BlockchainService] ⏳ Transaction sent:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("[BlockchainService] ✅ Transaction confirmed!");
      console.log("  Block:", receipt.blockNumber);
      console.log("  Gas Used:", receipt.gasUsed.toString());

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: "success"
      };
    } catch (error) {
      console.error("[BlockchainService] Error registering credential:", error);
      throw new Error("Failed to register on blockchain: " + error.message);
    }
  }

  /**
   * Verify if credential exists and is valid on-chain
   * 
   * @param {string} credentialHash - Hash to verify
   * @returns {Promise<boolean>} True if valid
   */
  async verifyOnChain(credentialHash) {
    try {
      if (!this.contract) await this.initialize();

      console.log("[BlockchainService] 🔍 Verifying credential...");
      
      const isValid = await this.contract.verifyCredential(credentialHash);
      console.log("[BlockchainService] Verification result:", isValid);

      return isValid;
    } catch (error) {
      console.error("[BlockchainService] Error verifying credential:", error);
      throw new Error("Failed to verify on blockchain: " + error.message);
    }
  }

  /**
   * Get issuer address for a credential
   * 
   * @param {string} credentialHash - Credential hash
   * @returns {Promise<string>} Issuer address
   */
  async getIssuer(credentialHash) {
    try {
      if (!this.contract) await this.initialize();

      const issuerAddress = await this.contract.getIssuer(credentialHash);
      console.log("[BlockchainService] Issuer:", issuerAddress);

      return issuerAddress;
    } catch (error) {
      console.error("[BlockchainService] Error getting issuer:", error);
      throw new Error("Failed to get issuer: " + error.message);
    }
  }

  /**
   * Get full credential data from blockchain
   * 
   * @param {string} credentialHash - Credential hash
   * @returns {Promise<Object>} Credential data
   */
  async getCredentialData(credentialHash) {
    try {
      if (!this.contract) await this.initialize();

      const credential = await this.contract.getCredential(credentialHash);

      return {
        issuer: credential.issuer,
        issuedAt: credential.issuedAt.toNumber(),
        revoked: credential.revoked,
        credentialType: credential.credentialType
      };
    } catch (error) {
      console.error("[BlockchainService] Error getting credential data:", error);
      throw new Error("Failed to get credential data: " + error.message);
    }
  }

  /**
   * Check if credential exists on-chain
   * 
   * @param {string} credentialHash - Hash to check
   * @returns {Promise<boolean>} True if exists
   */
  async exists(credentialHash) {
    try {
      if (!this.contract) await this.initialize();

      const exists = await this.contract.credentialExists(credentialHash);
      return exists;
    } catch (error) {
      console.error("[BlockchainService] Error checking existence:", error);
      throw new Error("Failed to check credential existence: " + error.message);
    }
  }

  /**
   * Get current gas price on Sepolia
   * 
   * @returns {Promise<string>} Gas price in Gwei
   */
  async getGasPrice() {
    try {
      if (!this.provider) await this.initialize();

      const gasPrice = await this.provider.getGasPrice();
      const gweiPrice = ethers.utils.formatUnits(gasPrice, "gwei");

      console.log("[BlockchainService] Current gas price:", gweiPrice, "Gwei");
      return gweiPrice;
    } catch (error) {
      console.error("[BlockchainService] Error getting gas price:", error);
      throw error;
    }
  }

  /**
   * Get signer balance
   * 
   * @returns {Promise<string>} Balance in ETH
   */
  async getSignerBalance() {
    try {
      if (!this.signer || !this.provider) await this.initialize();

      const balance = await this.provider.getBalance(this.signer.address);
      const ethBalance = ethers.utils.formatEther(balance);

      console.log("[BlockchainService] Signer balance:", ethBalance, "ETH");
      return ethBalance;
    } catch (error) {
      console.error("[BlockchainService] Error getting balance:", error);
      throw error;
    }
  }

  /**
   * Get network information
   * 
   * @returns {Promise<Object>} Network info
   */
  async getNetworkInfo() {
    try {
      if (!this.provider) await this.initialize();

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber: blockNumber
      };
    } catch (error) {
      console.error("[BlockchainService] Error getting network info:", error);
      throw error;
    }
  }
}

module.exports = new BlockchainService();
