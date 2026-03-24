/**
 * Wallet Controller
 *
 * Handles student wallet operations.
 */

const CredentialService = require("../services/credentialService");
const QRCode = require("qrcode");

class WalletController {
  static async storeCredential(req, res) {
    try {
      console.log("[WalletController] Received credential storage request");

      const {
        userId,
        credential,
        credentialHash,
        signature,
        credentialType,
        verifiableCredential,
      } = req.body;

      const incomingCredential = verifiableCredential || credential;
      const incomingHash = credentialHash || incomingCredential?.proof?.blockchainHash;
      const incomingSignature = signature || incomingCredential?.proof?.jws;

      if (!userId || !incomingCredential || !incomingHash || !incomingSignature) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const stored = await CredentialService.registerCredential(
        userId,
        incomingCredential,
        incomingHash,
        incomingSignature,
        credentialType || incomingCredential?.credentialSubject?.degree || "Certificate"
      );

      res.json({
        success: true,
        message: "Credential stored successfully",
        credentialId: stored.id,
      });
    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to store credential",
        error: error.message,
      });
    }
  }

  static async getCredentials(req, res) {
    try {
      console.log("[WalletController] Retrieving credentials for user");

      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId query parameter required",
        });
      }

      const credentials = CredentialService.findCredentials(userId);
      const formatted = credentials.map((credential) =>
        CredentialService.summarizeCredential(credential)
      );

      res.json({
        success: true,
        count: formatted.length,
        lookupValue: userId,
        credentials: formatted,
      });
    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve credentials",
        error: error.message,
      });
    }
  }

  static async getCredential(req, res) {
    try {
      console.log("[WalletController] Retrieving specific credential");

      const { hash } = req.params;
      const credential = CredentialService.getCredentialByHash(hash);

      if (!credential) {
        return res.status(404).json({
          success: false,
          message: "Credential not found",
        });
      }

      res.json({
        success: true,
        credential: {
          ...credential,
          signature: credential.signature?.substring(0, 20) + "...",
        },
      });
    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve credential",
      });
    }
  }

  static async generateQR(req, res) {
    try {
      console.log("[WalletController] Generating QR code");

      const { credentialHash } = req.body;

      if (!credentialHash) {
        return res.status(400).json({
          success: false,
          message: "credentialHash required",
        });
      }

      const credential = CredentialService.getCredentialByHash(credentialHash);

      if (!credential) {
        return res.status(404).json({
          success: false,
          message: "Credential not found",
        });
      }

      const qrData = JSON.stringify({
        hash: credentialHash,
        did: credential.verifiableCredential?.credentialSubject?.id || null,
        cid: credential.storage?.cid || null,
        type: credential.credentialType,
      });

      const qrImage = await QRCode.toDataURL(qrData);

      res.json({
        success: true,
        qrCode: qrImage,
      });
    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
        error: error.message,
      });
    }
  }

  static async downloadCredential(req, res) {
    try {
      console.log("[WalletController] Downloading credential");

      const { hash } = req.params;
      const credential = CredentialService.getCredentialByHash(hash);

      if (!credential) {
        return res.status(404).json({
          success: false,
          message: "Credential not found",
        });
      }

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=credential-${hash.substring(0, 8)}.json`
      );

      res.send(JSON.stringify(credential.verifiableCredential, null, 2));
    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to download credential",
      });
    }
  }

  static async getSummary(req, res) {
    try {
      console.log("[WalletController] Getting wallet summary");

      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId query parameter required",
        });
      }

      const credentials = CredentialService.getStudentCredentials(userId);

      res.json({
        success: true,
        summary: {
          userId,
          totalCredentials: credentials.length,
          credentials: credentials.map((credential) =>
            CredentialService.summarizeCredential(credential)
          ),
        },
      });
    } catch (error) {
      console.error("[WalletController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get wallet summary",
      });
    }
  }
}

module.exports = WalletController;
