/**
 * Issuer Controller
 *
 * Handles credential creation and issuance.
 */

const CredentialService = require("../services/credentialService");
const BlockchainService = require("../services/blockchainService");

class IssuerController {
  static async createCredential(req, res) {
    try {
      console.log("[IssuerController] Received credential creation request");

      const { studentName, degree, year, studentWalletAddress, studentId } = req.body;

      if (!studentName || !degree || !year || !studentWalletAddress) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: studentName, degree, year, studentWalletAddress",
        });
      }

      const issuerPrivateKey = process.env.PRIVATE_KEY;
      if (!issuerPrivateKey) {
        return res.status(500).json({
          success: false,
          message: "Issuer not configured",
        });
      }

      const credential = await CredentialService.createCredential(
        {
          studentName,
          degree,
          year,
          studentWalletAddress,
          studentId,
        },
        issuerPrivateKey
      );

      res.json({
        success: true,
        message: "Credential created successfully",
        credentialHash: credential.credentialHash,
        issuerAddress: credential.issuerAddress,
        issuerDid: credential.issuerDid,
        subjectDid: credential.subjectDid,
        storage: credential.storage,
        verifiableCredential: credential.verifiableCredential,
      });
    } catch (error) {
      console.error("[IssuerController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create credential",
        error: error.message,
      });
    }
  }

  static async issueCredential(req, res) {
    try {
      console.log("[IssuerController] Received credential issuance request");

      const { studentName, degree, year, studentId, studentWalletAddress } = req.body;

      if (!studentName || !degree || !year || !studentWalletAddress) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: studentName, degree, year, studentWalletAddress",
        });
      }

      const finalStudentId = studentId || studentWalletAddress;
      const issuerPrivateKey = process.env.PRIVATE_KEY;

      if (!issuerPrivateKey) {
        return res.status(500).json({
          success: false,
          message: "Issuer not configured",
        });
      }

      const issuerReadiness = await BlockchainService.ensureIssuerReady(
        process.env.ISSUER_NAME || "SSI Sepolia Issuer"
      );

      const issued = await CredentialService.issueCredential(
        {
          studentName,
          degree,
          year,
          studentId: finalStudentId,
          studentWalletAddress,
        },
        finalStudentId,
        issuerPrivateKey
      );

      res.json({
        success: true,
        message: "Credential issued successfully",
        credentialId: issued.id,
        studentId: issued.studentId,
        credentialHash: issued.credentialHash,
        blockchainTx: issued.blockchainTx,
        blockNumber: issued.blockNumber,
        credential: issued.data,
        issuer: issuerReadiness,
        verifiableCredential: issued.verifiableCredential,
        storage: issued.storage,
      });
    } catch (error) {
      console.error("[IssuerController] Error:", error);
      const status =
        error.message && error.message.includes("not approved on contract")
          ? 403
          : 500;

      res.status(status).json({
        success: false,
        message: error.message || "Failed to issue credential",
        error: error.message,
      });
    }
  }

  static async getIssuerInfo(req, res) {
    try {
      await BlockchainService.initialize();

      const issuerAddress = BlockchainService.signer.address;
      const balance = await BlockchainService.getSignerBalance();
      const networkInfo = await BlockchainService.getNetworkInfo();

      res.json({
        success: true,
        issuerAddress,
        balance,
        network: networkInfo,
        issuer: await BlockchainService.getIssuerInfo(issuerAddress),
      });
    } catch (error) {
      console.error("[IssuerController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get issuer info",
        error: error.message,
      });
    }
  }

  static async getStats(req, res) {
    try {
      const stats = CredentialService.getStatistics();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("[IssuerController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get statistics",
      });
    }
  }
}

module.exports = IssuerController;
