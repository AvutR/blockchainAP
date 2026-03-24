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
    "name": "checkCredentialExists",
    "outputs": [{ "internalType": "bool", "name": "exists", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_issuerAddress", "type": "address" }],
    "name": "isApprovedIssuer",
    "outputs": [{ "internalType": "bool", "name": "isApproved", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_issuerAddress", "type": "address" }],
    "name": "getIssuerInfo",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "issuerAddress", "type": "address" },
          { "internalType": "string", "name": "issuerName", "type": "string" },
          { "internalType": "bool", "name": "isApproved", "type": "bool" },
          { "internalType": "uint256", "name": "registeredAt", "type": "uint256" }
        ],
        "internalType": "struct CredentialRegistry.Issuer",
        "name": "issuer",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_issuerAddress", "type": "address" },
      { "internalType": "string", "name": "_issuerName", "type": "string" }
    ],
    "name": "registerIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
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
   * Get the contract admin address.
   *
   * @returns {Promise<string>} Admin address
   */
  async getAdmin() {
    try {
      if (!this.contract) await this.initialize();
      return await this.contract.admin();
    } catch (error) {
      console.error("[BlockchainService] Error getting admin:", error);
      throw new Error("Failed to get contract admin: " + error.message);
    }
  }

  /**
   * Check whether an address is an approved issuer.
   *
   * @param {string} issuerAddress - Address to check
   * @returns {Promise<boolean>} True if approved
   */
  async isApprovedIssuer(issuerAddress) {
    try {
      if (!this.contract) await this.initialize();
      return await this.contract.isApprovedIssuer(issuerAddress);
    } catch (error) {
      console.error("[BlockchainService] Error checking issuer approval:", error);
      throw new Error("Failed to check issuer approval: " + error.message);
    }
  }

  /**
   * Get issuer info from the contract.
   *
   * @param {string} issuerAddress - Address to query
   * @returns {Promise<Object>} Issuer information
   */
  async getIssuerInfo(issuerAddress) {
    try {
      if (!this.contract) await this.initialize();

      const issuer = await this.contract.getIssuerInfo(issuerAddress);

      return {
        issuerAddress: issuer.issuerAddress,
        issuerName: issuer.issuerName,
        isApproved: issuer.isApproved,
        registeredAt: issuer.registeredAt?.toNumber?.() || 0,
      };
    } catch (error) {
      console.error("[BlockchainService] Error getting issuer info:", error);
      throw new Error("Failed to get issuer info: " + error.message);
    }
  }

  /**
   * Register an issuer when the current signer has admin permissions.
   *
   * @param {string} issuerAddress - Issuer address to register
   * @param {string} issuerName - Issuer display name
   * @returns {Promise<Object>} Transaction receipt summary
   */
  async registerIssuer(issuerAddress, issuerName) {
    try {
      if (!this.contract) await this.initialize();

      console.log("[BlockchainService] Registering issuer...");
      console.log("  Issuer:", issuerAddress);
      console.log("  Name:", issuerName);

      const tx = await this.contract.registerIssuer(issuerAddress, issuerName);
      const receipt = await tx.wait();

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: "success",
      };
    } catch (error) {
      console.error("[BlockchainService] Error registering issuer:", error);
      throw new Error("Failed to register issuer: " + error.message);
    }
  }

  /**
   * Ensure the current signer can issue credentials.
   * If the signer is the contract admin, auto-register it as an issuer.
   *
   * @param {string} issuerName - Name to register on-chain when needed
   * @returns {Promise<Object>} Issuer readiness details
   */
  async ensureIssuerReady(issuerName = "SSI Sepolia Issuer") {
    try {
      if (!this.contract || !this.signer) await this.initialize();

      const signerAddress = this.signer.address;
      const [adminAddress, approved] = await Promise.all([
        this.getAdmin(),
        this.isApprovedIssuer(signerAddress),
      ]);

      if (approved) {
        return {
          issuerAddress: signerAddress,
          adminAddress,
          isApproved: true,
          autoRegistered: false,
        };
      }

      if (adminAddress.toLowerCase() !== signerAddress.toLowerCase()) {
        throw new Error(
          `Issuer wallet ${signerAddress} is not approved on contract ${this.contract.address}. Register it with registerIssuer(...) from admin ${adminAddress}.`
        );
      }

      await this.registerIssuer(signerAddress, issuerName);

      return {
        issuerAddress: signerAddress,
        adminAddress,
        isApproved: true,
        autoRegistered: true,
      };
    } catch (error) {
      console.error("[BlockchainService] Error ensuring issuer readiness:", error);
      throw new Error(error.message || "Failed to prepare issuer for credential issuance.");
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

      const exists = await this.contract.checkCredentialExists(credentialHash);
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
