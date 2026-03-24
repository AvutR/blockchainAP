/**
 * Cryptographic Service
 * 
 * Handles all cryptographic operations:
 * - Hashing credentials using Keccak256
 * - Signing credentials using private key
 * - Verifying signatures
 */

const ethers = require("ethers");

class CryptoService {
  
  /**
   * Hash credential data using Keccak256
   * This matches the hashing in smart contract
   * 
   * @param {Object} credentialData - Credential data to hash
   * @returns {string} Keccak256 hash
   */
  static hashCredential(credentialData) {
    try {
      // Convert credential object to JSON string
      const dataString = JSON.stringify(credentialData);
      
      // Hash using Keccak256 (same as contract)
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));
      
      console.log("[CryptoService] Credential hashed successfully");
      return hash;
    } catch (error) {
      console.error("[CryptoService] Error hashing credential:", error);
      throw new Error("Failed to hash credential: " + error.message);
    }
  }

  /**
   * Sign credential data using private key
   * Creates an ECDSA signature that can be verified against public key
   * 
   * @param {string} credentialHash - Hash of credential
   * @param {string} privateKey - Private key for signing
   * @returns {Promise<string>} Signed message
   */
  static async signCredential(credentialHash, privateKey) {
    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey);
      
      // Sign the hash
      const signature = await wallet.signMessage(ethers.utils.arrayify(credentialHash));
      
      console.log("[CryptoService] Credential signed successfully");
      return signature;
    } catch (error) {
      console.error("[CryptoService] Error signing credential:", error);
      throw new Error("Failed to sign credential: " + error.message);
    }
  }

  /**
   * Verify signature against public key
   * 
   * @param {string} credentialHash - Original credential hash
   * @param {string} signature - Signature to verify
   * @param {string} publicAddress - Signer's public address
   * @returns {boolean} True if signature is valid
   */
  static verifySignature(credentialHash, signature, publicAddress) {
    try {
      // Recover address from signature
      const recoveredAddress = ethers.utils.verifyMessage(
        ethers.utils.arrayify(credentialHash),
        signature
      );

      const isValid = recoveredAddress.toLowerCase() === publicAddress.toLowerCase();
      
      console.log("[CryptoService] Signature verification:", isValid);
      return isValid;
    } catch (error) {
      console.error("[CryptoService] Error verifying signature:", error);
      return false;
    }
  }

  /**
   * Get public address from private key
   * 
   * @param {string} privateKey - Private key
   * @returns {string} Public address
   */
  static getAddressFromPrivateKey(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return wallet.address;
    } catch (error) {
      console.error("[CryptoService] Error deriving address:", error);
      throw new Error("Failed to derive address: " + error.message);
    }
  }

  /**
   * Validate if a string is a valid Ethereum address
   * 
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid address
   */
  static isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  /**
   * Validate if a string is valid private key
   * 
   * @param {string} privateKey - Private key to validate
   * @returns {boolean} True if valid
   */
  static isValidPrivateKey(privateKey) {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate random credential ID
   * 
   * @returns {string} Random credential ID
   */
  static generateCredentialId() {
    return ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(Date.now().toString() + Math.random())
    );
  }
}

module.exports = CryptoService;
