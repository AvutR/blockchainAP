/**
 * Wallet Controller
 * 
 * Handles student wallet operations:
 * - Store credentials
 * - Retrieve credentials
 * - Generate QR codes
 * - Download credentials
 */

const CredentialService = require("../services/credentialService");
const QRCode = require("qrcode");

class WalletController {
  
  /**
   * Store credential in wallet
   * 
   * POST /api/wallet/store
   * Body: {
   *   "userId": "student123",
   *   "credential": { ... },
   *   "signature": "0x..."
   * }
   */
  static async storeCredential(req, res) {
    try {
      console.log("[WalletController] Received credential storage request");

      const { userId, credential, credentialHash, signature, credentialType } = req.body;

      // Validate input
      if (!userId || !credential || !credentialHash || !signature) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Register credential
      const stored = await CredentialService.registerCredential(
        userId,
        credential,
        credentialHash,
        signature,
        credentialType || "Certificate"
      );

      console.log("[WalletController] Credential stored successfully");

      res.json({
        success: true,
        message: "Credential stored successfully",
        credentialId: stored.id
      });

    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to store credential",
        error: error.message
      });
    }
  }

  /**
   * Get all credentials for a student
   * 
   * GET /api/wallet/credentials?userId=student123
   */
  static async getCredentials(req, res) {
    try {
      console.log("[WalletController] Retrieving credentials for user");

      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId query parameter required"
        });
      }

      const credentials = CredentialService.findCredentials(userId);

      // Format for response (don't expose all internal fields)
      const formatted = credentials.map(c => ({
        id: c.id,
        studentId: c.studentId,
        credentialHash: c.credentialHash,
        credentialType: c.credentialType,
        studentName: c.data?.studentName,
        degree: c.data?.degree,
        year: c.data?.year,
        issuedAt: c.data?.issuedAt,
        blockchainTx: c.blockchainTx
      }));

      console.log("[WalletController] Retrieved", formatted.length, "credentials");

      res.json({
        success: true,
        count: formatted.length,
        lookupValue: userId,
        credentials: formatted
      });

    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve credentials",
        error: error.message
      });
    }
  }

  /**
   * Get specific credential
   * 
   * GET /api/wallet/credential/:hash
   */
  static async getCredential(req, res) {
    try {
      console.log("[WalletController] Retrieving specific credential");

      const { hash } = req.params;

      const credential = CredentialService.getCredentialByHash(hash);

      if (!credential) {
        return res.status(404).json({
          success: false,
          message: "Credential not found"
        });
      }

      res.json({
        success: true,
        credential: {
          ...credential,
          signature: credential.signature.substring(0, 20) + "..."
        }
      });

    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve credential"
      });
    }
  }

  /**
   * Generate QR code for credential
   * 
   * POST /api/wallet/qr
   * Body: {
   *   "credentialHash": "0x..."
   * }
   */
  static async generateQR(req, res) {
    try {
      console.log("[WalletController] Generating QR code");

      const { credentialHash } = req.body;

      if (!credentialHash) {
        return res.status(400).json({
          success: false,
          message: "credentialHash required"
        });
      }

      const credential = CredentialService.getCredentialByHash(credentialHash);

      if (!credential) {
        return res.status(404).json({
          success: false,
          message: "Credential not found"
        });
      }

      // Generate QR code as data URL
      const qrData = JSON.stringify({
        hash: credentialHash,
        type: credential.credentialType
      });

      const qrImage = await QRCode.toDataURL(qrData);

      console.log("[WalletController] QR code generated successfully");

      res.json({
        success: true,
        qrCode: qrImage
      });

    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
        error: error.message
      });
    }
  }

  /**
   * Download credential as JSON
   * 
   * GET /api/wallet/download/:hash
   */
  static async downloadCredential(req, res) {
    try {
      console.log("[WalletController] Downloading credential");

      const { hash } = req.params;

      const credential = CredentialService.getCredentialByHash(hash);

      if (!credential) {
        return res.status(404).json({
          success: false,
          message: "Credential not found"
        });
      }

      // Format for export
      const exportData = {
        credentialHash: credential.credentialHash,
        signature: credential.signature,
        credentialType: credential.credentialType,
        blockchainTx: credential.blockchainTx,
        credential: credential.data
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=credential-${hash.substring(0, 8)}.json`
      );

      res.send(JSON.stringify(exportData, null, 2));

    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to download credential"
      });
    }
  }

  /**
   * Get wallet summary
   * 
   * GET /api/wallet/summary?userId=student123
   */
  static async getSummary(req, res) {
    try {
      console.log("[WalletController] Getting wallet summary");

      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId query parameter required"
        });
      }

      const credentials = CredentialService.getStudentCredentials(userId);

      const summary = {
        userId,
        totalCredentials: credentials.length,
        credentials: credentials.map(c => ({
          type: c.credentialType,
          student: c.data?.studentName,
          degree: c.data?.degree,
          year: c.data?.year,
          issued: c.data?.issuedAt
        }))
      };

      res.json({
        success: true,
        summary
      });

    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet summary"
      });
    }
  }
}

module.exports = WalletController;
