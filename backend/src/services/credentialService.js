/**
 * Credential Service
 *
 * Core business logic for creating, storing, and verifying credentials.
 */

const CryptoService = require("./cryptoService");
const BlockchainService = require("./blockchainService");
const DidService = require("./didService");
const IpfsService = require("./ipfsService");
const { v4: uuid } = require("uuid");

class CredentialService {
  constructor() {
    this.credentials = new Map();
    this.credentialDetails = new Map();
  }

  getCredentialType(credentialData) {
    return credentialData.degree || "UniversityDegreeCredential";
  }

  getCredentialClass(credentialData) {
    return credentialData.credentialClass || "UniversityDegreeCredential";
  }

  buildUnsignedCredential(credentialData, issuerDid, issuerName) {
    const subjectWalletAddress = credentialData.studentWalletAddress;
    const subjectDid = DidService.toDid(subjectWalletAddress);
    const issuanceDate = new Date().toISOString();

    return {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      id: `urn:uuid:${uuid()}`,
      type: ["VerifiableCredential", this.getCredentialClass(credentialData)],
      issuer: {
        id: issuerDid,
        name: issuerName,
      },
      issuanceDate,
      credentialSubject: {
        id: subjectDid,
        walletAddress: subjectWalletAddress,
        studentId: credentialData.studentId || subjectWalletAddress,
        studentName: credentialData.studentName,
        degree: credentialData.degree,
        year: credentialData.year,
      },
    };
  }

  createProof(signature, issuerDid, createdAt, credentialHash) {
    return {
      type: "EcdsaSecp256k1Signature2019",
      created: createdAt,
      proofPurpose: "assertionMethod",
      verificationMethod: DidService.toVerificationMethod(issuerDid),
      jws: signature,
      blockchainHash: credentialHash,
    };
  }

  async attachIpfsMetadata(verifiableCredential) {
    const uploadResult = await IpfsService.uploadJSON(
      verifiableCredential,
      `vc-${(verifiableCredential.id || Date.now()).replace(/[^a-zA-Z0-9-_]/g, "-")}`
    );

    verifiableCredential.proof.storage = {
      type: "ipfs",
      configured: uploadResult.configured,
      uploaded: uploadResult.uploaded,
      provider: uploadResult.provider,
      cid: uploadResult.cid,
      uri: uploadResult.uri,
      gatewayUrl: uploadResult.gatewayUrl,
      message: uploadResult.message,
    };

    return uploadResult;
  }

  summarizeCredential(storedCredential) {
    const vc = storedCredential.verifiableCredential;
    const subject = vc?.credentialSubject || {};

    return {
      id: storedCredential.id,
      studentId: storedCredential.studentId,
      credentialHash: storedCredential.credentialHash,
      credentialType: storedCredential.credentialType,
      studentName: subject.studentName || storedCredential.data?.studentName,
      degree: subject.degree || storedCredential.data?.degree,
      year: subject.year || storedCredential.data?.year,
      issuedAt: vc?.issuanceDate || storedCredential.data?.issuedAt,
      blockchainTx: storedCredential.blockchainTx,
      subjectDid: subject.id || null,
      issuerDid: vc?.issuer?.id || null,
      ipfsCid: storedCredential.storage?.cid || vc?.proof?.storage?.cid || null,
    };
  }

  async createCredential(credentialData, issuerPrivateKey) {
    try {
      console.log("[CredentialService] Creating W3C verifiable credential...");

      if (
        !credentialData.studentName ||
        !credentialData.degree ||
        !credentialData.year ||
        !credentialData.studentWalletAddress
      ) {
        throw new Error("Missing required credential fields");
      }

      if (!CryptoService.isValidAddress(credentialData.studentWalletAddress)) {
        throw new Error("studentWalletAddress must be a valid Ethereum address");
      }

      const issuerAddress = CryptoService.getAddressFromPrivateKey(issuerPrivateKey);
      const issuerDid = DidService.toDid(issuerAddress);
      const issuerName = process.env.ISSUER_NAME || "SSI Sepolia Issuer";
      const unsignedCredential = this.buildUnsignedCredential(
        credentialData,
        issuerDid,
        issuerName
      );
      const credentialHash = CryptoService.hashVerifiableCredential(unsignedCredential);
      const signature = await CryptoService.signCredential(credentialHash, issuerPrivateKey);

      const verifiableCredential = {
        ...unsignedCredential,
        proof: this.createProof(
          signature,
          issuerDid,
          unsignedCredential.issuanceDate,
          credentialHash
        ),
      };

      const storage = await this.attachIpfsMetadata(verifiableCredential);

      return {
        credentialHash,
        signature,
        issuerAddress,
        issuerDid,
        subjectDid: verifiableCredential.credentialSubject.id,
        verifiableCredential,
        credentialType: this.getCredentialType(credentialData),
        storage,
      };
    } catch (error) {
      console.error("[CredentialService] Error creating credential:", error);
      throw error;
    }
  }

  async registerCredential(
    studentId,
    verifiableCredential,
    credentialHash,
    signature,
    credentialType
  ) {
    try {
      console.log("[CredentialService] Registering credential on blockchain...");

      const blockchainResult = await BlockchainService.registerOnChain(
        credentialHash,
        credentialType
      );

      verifiableCredential.proof.blockchainTx = blockchainResult.transactionHash;
      verifiableCredential.proof.blockNumber = blockchainResult.blockNumber;

      const storedCredential = {
        id: verifiableCredential.id || `urn:uuid:${uuid()}`,
        studentId,
        credentialHash,
        signature,
        credentialType,
        blockchainTx: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        storageTimestamp: new Date().toISOString(),
        storage: verifiableCredential.proof?.storage || null,
        verifiableCredential,
        data: {
          studentName: verifiableCredential.credentialSubject?.studentName,
          degree: verifiableCredential.credentialSubject?.degree,
          year: verifiableCredential.credentialSubject?.year,
          issuedAt: verifiableCredential.issuanceDate,
        },
      };

      if (!this.credentials.has(studentId)) {
        this.credentials.set(studentId, []);
      }

      this.credentials.get(studentId).push(storedCredential);
      this.credentialDetails.set(credentialHash, storedCredential);

      console.log("[CredentialService] Credential registered successfully");
      return storedCredential;
    } catch (error) {
      console.error("[CredentialService] Error registering credential:", error);
      throw error;
    }
  }

  async issueCredential(credentialData, studentId, issuerPrivateKey) {
    try {
      console.log("[CredentialService] Issuing credential end-to-end...");

      const created = await this.createCredential(credentialData, issuerPrivateKey);

      const registered = await this.registerCredential(
        studentId,
        created.verifiableCredential,
        created.credentialHash,
        created.signature,
        created.credentialType
      );

      return registered;
    } catch (error) {
      console.error("[CredentialService] Error issuing credential:", error);
      throw error;
    }
  }

  getStudentCredentials(studentId) {
    return this.credentials.get(studentId) || [];
  }

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
          credential.credentialHash === lookupKey ||
          credential.verifiableCredential?.credentialSubject?.id === lookupKey ||
          credential.verifiableCredential?.credentialSubject?.walletAddress === lookupKey
        ) {
          matches.push(credential);
        }
      }
    }

    return matches;
  }

  getCredentialByHash(credentialHash) {
    return this.credentialDetails.get(credentialHash);
  }

  async verifyCredential(credential, issuerAddress) {
    try {
      const hash = credential.proof
        ? CryptoService.hashVerifiableCredential(credential)
        : CryptoService.hashCredential(credential);

      const signatureValid = CryptoService.verifySignature(
        hash,
        credential.proof?.jws || credential.signature,
        issuerAddress
      );

      let blockchainValid = false;
      let blockchainData = null;

      try {
        blockchainValid = await BlockchainService.verifyOnChain(hash);
        blockchainData = await BlockchainService.getCredentialData(hash);
      } catch (error) {
        console.log("[CredentialService] Blockchain verification failed");
      }

      return {
        isValid: signatureValid && blockchainValid,
        signatureValid,
        blockchainValid,
        credentialHash: hash,
        issuerAddress,
        blockchainData,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[CredentialService] Error verifying credential:", error);
      throw error;
    }
  }

  getStatistics() {
    return {
      totalStudents: this.credentials.size,
      totalCredentials: this.credentialDetails.size,
      students: Array.from(this.credentials.keys()),
    };
  }

  clearStorage() {
    this.credentials.clear();
    this.credentialDetails.clear();
    console.log("[CredentialService] Storage cleared");
  }
}

module.exports = new CredentialService();
