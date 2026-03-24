/**
 * Issuer Controller
 * 
 * Handles credential issuance endpoints:
 * - Create and issue credentials
 * - Return credential data to student
 */

const CredentialService = require("../services/credentialService");
const BlockchainService = require("../services/blockchainService");

class IssuerController {
  
  /**
   * Create and issue a credential
   * 
   * POST /api/issuer/create-credential
   * Body: {
   *   "studentName": "John Doe",
   *   "degree": "Bachelor of Science",
   *   "year": 2024,
   *   "issuerAddress": "0x..."
   * }
   */
  static async createCredential(req, res) {
    try {
      console.log("[IssuerController] Received credential creation request");
      
      const { studentName, degree, year, issuerAddress } = req.body;

      // Validate input
      if (!studentName || !degree || !year) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: studentName, degree, year"
        });
      }

      // Get issuer private key from environment
      const issuerPrivateKey = process.env.PRIVATE_KEY;
      if (!issuerPrivateKey) {
        return res.status(500).json({
          success: false,
          message: "Issuer not configured"
        });
      }

      // Create credential
      const credential = await CredentialService.createCredential(
        {
          studentName,
          degree,
          year
        },
        issuerPrivateKey
      );

      console.log("[IssuerController] Credential created successfully");

      res.json({
        success: true,
        message: "Credential created successfully",
        credentialHash: credential.credentialHash,
        signature: credential.signature,
        issuerAddress: credential.issuerAddress,
        credential: credential.credential
      });

    } catch (error) {
      console.error("[IssuerController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create credential",
        error: error.message
      });
    }
  }

  /**
   * Issue credential (create + register on blockchain)
   * 
   * POST /api/issuer/issue-credential
   * Body: {
   *   "studentName": "John Doe",
   *   "degree": "Bachelor of Science",
   *   "year": 2024,
   *   "studentId": "student123" (optional, defaults to studentName)
   * }
   */
  static async issueCredential(req, res) {
    try {
      console.log("[IssuerController] Received credential issuance request");

      const { studentName, degree, year, studentId } = req.body;

      // Validate input
      if (!studentName || !degree || !year) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: studentName, degree, year"
        });
      }

      const finalStudentId = studentId || studentName;
      const issuerPrivateKey = process.env.PRIVATE_KEY;

      if (!issuerPrivateKey) {
        return res.status(500).json({
          success: false,
          message: "Issuer not configured"
        });
      }

      const issuerReadiness = await BlockchainService.ensureIssuerReady(
        process.env.ISSUER_NAME || "SSI Sepolia Issuer"
      );
      console.log("[IssuerController] Issuer readiness:", issuerReadiness);

      // Issue credential end-to-end
      const issued = await CredentialService.issueCredential(
        { studentName, degree, year },
        finalStudentId,
        issuerPrivateKey
      );

      console.log("[IssuerController] Credential issued successfully");

      res.json({
        success: true,
        message: "Credential issued successfully",
        credentialId: issued.id,
        studentId: issued.studentId,
        credentialHash: issued.credentialHash,
        blockchainTx: issued.blockchainTx,
        blockNumber: issued.blockNumber,
        credential: issued.data,
        issuer: issuerReadiness
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
        error: error.message
      });
    }
  }

  /**
   * Get issuer information
   * 
   * GET /api/issuer/info
   */
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
        issuer: await BlockchainService.getIssuerInfo(issuerAddress)
      });

    } catch (error) {
      console.error("[IssuerController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get issuer info",
        error: error.message
      });
    }
  }

  /**
   * Get statistics
   * 
   * GET /api/issuer/stats
   */
  static async getStats(req, res) {
    try {
      const stats = CredentialService.getStatistics();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error("[IssuerController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get statistics"
      });
    }
  }
}

module.exports = IssuerController;
