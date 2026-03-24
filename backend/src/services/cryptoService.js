/**
 * Cryptographic Service
 *
 * Handles hashing, signing, and signature verification for credentials.
 */

const ethers = require("ethers");

class CryptoService {
  static canonicalize(value) {
    if (Array.isArray(value)) {
      return value.map((item) => this.canonicalize(item));
    }

    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort()
        .reduce((accumulator, key) => {
          if (value[key] !== undefined) {
            accumulator[key] = this.canonicalize(value[key]);
          }
          return accumulator;
        }, {});
    }

    return value;
  }

  static serializeCredential(credentialData) {
    return JSON.stringify(this.canonicalize(credentialData));
  }

  static hashCredential(credentialData) {
    try {
      const dataString = this.serializeCredential(credentialData);
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(dataString));

      console.log("[CryptoService] Credential hashed successfully");
      return hash;
    } catch (error) {
      console.error("[CryptoService] Error hashing credential:", error);
      throw new Error("Failed to hash credential: " + error.message);
    }
  }

  static stripProof(verifiableCredential) {
    if (!verifiableCredential || typeof verifiableCredential !== "object") {
      throw new Error("A verifiable credential object is required");
    }

    const { proof, ...unsignedCredential } = verifiableCredential;
    return unsignedCredential;
  }

  static hashVerifiableCredential(verifiableCredential) {
    return this.hashCredential(this.stripProof(verifiableCredential));
  }

  static async signCredential(credentialHash, privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      const signature = await wallet.signMessage(ethers.utils.arrayify(credentialHash));

      console.log("[CryptoService] Credential signed successfully");
      return signature;
    } catch (error) {
      console.error("[CryptoService] Error signing credential:", error);
      throw new Error("Failed to sign credential: " + error.message);
    }
  }

  static verifySignature(credentialHash, signature, publicAddress) {
    try {
      if (!signature || !publicAddress) {
        return false;
      }

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

  static getAddressFromPrivateKey(privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return wallet.address;
    } catch (error) {
      console.error("[CryptoService] Error deriving address:", error);
      throw new Error("Failed to derive address: " + error.message);
    }
  }

  static isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  static isValidPrivateKey(privateKey) {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  static generateCredentialId() {
    return ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(Date.now().toString() + Math.random())
    );
  }
}

module.exports = CryptoService;
