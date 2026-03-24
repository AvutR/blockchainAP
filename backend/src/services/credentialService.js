/**
 * Credential Service
 * 
 * Core business logic for credentials:
 * - Creating credentials
 * - Storing credentials (in-memory for demo)
 * - Retrieving credentials
 * - Coordinating crypto and blockchain services
 */

const CryptoService = require("./cryptoService");
const BlockchainService = require("./blockchainService");
const { v4: uuid } = require("uuid");

class CredentialService {
  
  constructor() {
    // In-memory storage (in production, use database like MongoDB)
    this.credentials = new Map(); // userId -> [credentials]
    this.credentialDetails = new Map(); // hash -> credential details
  }

  /**
   * Create a new credential for a student
   * 
   * @param {Object} credentialData - Credential information
   * @param {string} credentialData.studentName - Student name
   * @param {string} credentialData.degree - Degree name
   * @param {number} credentialData.year - Year of graduation
   * @param {string} issuerPrivateKey - Issuer's private key
   * @returns {Promise<Object>} Credential with hash and signature
   */
  async createCredential(credentialData, issuerPrivateKey) {
    try {
      console.log("[CredentialService] 📝 Creating credential...");

      // Validate input
      if (!credentialData.studentName || !credentialData.degree || !credentialData.year) {
        throw new Error("Missing required credential fields");
      }

      // Add metadata
      const fullCredential = {
        ...credentialData,
        id: uuid(),
        issuedAt: new Date().toISOString(),
        version: "1.0"
      };

      // Hash the credential
      const credentialHash = CryptoService.hashCredential(fullCredential);
      console.log("[CredentialService] Hash:", credentialHash);

      // Sign the credential
      const signature = await CryptoService.signCredential(
        credentialHash,
        issuerPrivateKey
      );
      console.log("[CredentialService] Signed successfully");

      // Get issuer address
      const issuerAddress = CryptoService.getAddressFromPrivateKey(issuerPrivateKey);

      const result = {
        credentialHash,
        signature,
        issuerAddress,
        credential: fullCredential,
        credentialType: credentialData.degree || "Certificate"
      };

      console.log("[CredentialService] ✅ Credential created successfully");
      return result;
    } catch (error) {
      console.error("[CredentialService] Error creating credential:", error);
      throw error;
    }
  }

  /**
   * Register credential on blockchain and store locally
   * 
   * @param {string} studentId - Student ID/wallet
   * @param {Object} credentialData - Full credential object
   * @param {string} credentialHash - Hash of credential
   * @param {string} signature - Signature
   * @param {string} credentialType - Type of credential
   * @returns {Promise<Object>} Stored credential with blockchain tx
   */
  async registerCredential(
    studentId,
    credentialData,
    credentialHash,
    signature,
    credentialType
  ) {
    try {
      console.log("[CredentialService] 🔗 Registering credential on blockchain...");

      // Register on blockchain
      const blockchainResult = await BlockchainService.registerOnChain(
        credentialHash,
        credentialType
      );

      // Store credential locally
      const storedCredential = {
        id: credentialData.id || uuid(),
        studentId,
        credentialHash,
        signature,
        credentialType,
        blockchainTx: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        storageTimestamp: new Date().toISOString(),
        data: credentialData
      };

      // Add to student's credentials
      if (!this.credentials.has(studentId)) {
        this.credentials.set(studentId, []);
      }
      this.credentials.get(studentId).push(storedCredential);

      // Also store by hash for quick lookup
      this.credentialDetails.set(credentialHash, storedCredential);

      console.log("[CredentialService] ✅ Credential registered successfully");
      return storedCredential;
    } catch (error) {
      console.error("[CredentialService] Error registering credential:", error);
      throw error;
    }
  }

  /**
   * Issue credential end-to-end
   * Creates, signs, and registers a credential
   * 
   * @param {Object} credentialData - Credential information
   * @param {string} studentId - Student ID/wallet
   * @param {string} issuerPrivateKey - Issuer's private key
   * @returns {Promise<Object>} Complete credential with blockchain confirmation
   */
  async issueCredential(credentialData, studentId, issuerPrivateKey) {
    try {
      console.log("[CredentialService] 🎓 Issuing credential...");

      // Step 1: Create credential
      const created = await this.createCredential(credentialData, issuerPrivateKey);

      // Step 2: Register on blockchain
      const registered = await this.registerCredential(
        studentId,
        created.credential,
        created.credentialHash,
        created.signature,
        created.credentialType
      );

      console.log("[CredentialService] ✅ Credential issued successfully!");
      return registered;
    } catch (error) {
      console.error("[CredentialService] Error issuing credential:", error);
      throw error;
    }
  }

  /**
   * Get all credentials for a student
   * 
   * @param {string} studentId - Student ID
   * @returns {Array} Array of credentials
   */
  getStudentCredentials(studentId) {
    return this.credentials.get(studentId) || [];
  }

  /**
   * Find credentials by a wallet lookup key.
   * Supports student ID, credential ID, or credential hash.
   *
   * @param {string} lookupKey - Lookup value entered by the user
   * @returns {Array} Matching credentials
   */
  findCredentials(lookupKey) {
    if (!lookupKey) {
      return [];
    }

    if (this.credentials.has(lookupKey)) {
      return this.credentials.get(lookupKey) || [];
    }

    const matches = [];

    for (const credentialList of this.credentials.values()) {
      for (const credential of credentialList) {
        if (
          credential.id === lookupKey ||
          credential.credentialHash === lookupKey
        ) {
          matches.push(credential);
        }
      }
    }

    return matches;
  }

  /**
   * Get specific credential by hash
   * 
   * @param {string} credentialHash - Credential hash
   * @returns {Object} Credential details
   */
  getCredentialByHash(credentialHash) {
    return this.credentialDetails.get(credentialHash);
  }

  /**
   * Verify a credential
   * Checks signature and blockchain validity
   * 
   * @param {Object} credential - Credential object with signature
   * @param {string} issuerAddress - Expected issuer address
   * @returns {Promise<Object>} Verification result
   */
  async verifyCredential(credential, issuerAddress) {
    try {
      console.log("[CredentialService] 🔍 Verifying credential...");

      // Hash the credential
      const hash = CryptoService.hashCredential(credential);
      console.log("[CredentialService] Computed hash:", hash);

      // Verify signature
      const signatureValid = CryptoService.verifySignature(
        hash,
        credential.signature,
        issuerAddress
      );
      console.log("[CredentialService] Signature valid:", signatureValid);

      // Verify on blockchain
      let blockchainValid = false;
      let blockchainData = null;

      try {
        blockchainValid = await BlockchainService.verifyOnChain(hash);
        blockchainData = await BlockchainService.getCredentialData(hash);
      } catch (error) {
        console.log("[CredentialService] Blockchain verification failed (contract may not be deployed)");
      }

      const result = {
        isValid: signatureValid && blockchainValid,
        signatureValid,
        blockchainValid,
        credentialHash: hash,
        issuerAddress,
        blockchainData,
        verifiedAt: new Date().toISOString()
      };

      console.log("[CredentialService] ✅ Verification complete");
      return result;
    } catch (error) {
      console.error("[CredentialService] Error verifying credential:", error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * 
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalStudents: this.credentials.size,
      totalCredentials: this.credentialDetails.size,
      students: Array.from(this.credentials.keys())
    };
  }

  /**
   * Clear all data (for testing)
   */
  clearStorage() {
    this.credentials.clear();
    this.credentialDetails.clear();
    console.log("[CredentialService] 🗑️ Storage cleared");
  }
}

module.exports = new CredentialService();
