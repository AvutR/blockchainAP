/**
 * Verifier Controller
 * 
 * Handles credential verification:
 * - Verify signature
 * - Verify blockchain status
 * - Validate issuer
 */

const CredentialService = require("../services/credentialService");
const BlockchainService = require("../services/blockchainService");
const CryptoService = require("../services/cryptoService");

class VerifierController {
  
  /**
   * Verify a credential
   * 
   * POST /api/verify/validate-credential
   * Body: {
   *   "credential": { ... full credential object },
   *   "signature": "0x...",
   *   "credentialHash": "0x..." (optional, will be computed if not provided)
   * }
   */
  static async verifyCredential(req, res) {
    try {
      console.log("[VerifierController] Received credential verification request");

      const { credential, signature, credentialHash: providedHash } = req.body;

      // Validate input
      if (!credential || !signature) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: credential, signature"
        });
      }

      // Compute hash
      const computedHash = CryptoService.hashCredential(credential);

      // If hash provided, verify it matches
      if (providedHash && providedHash !== computedHash) {
        return res.status(400).json({
          success: false,
          message: "Provided hash does not match computed hash",
          computedHash
        });
      }

      // Extract issuer from credential or attempt to get from blockchain
      let issuerAddress = credential.issuerAddress;

      // If not in credential, try to get from blockchain
      if (!issuerAddress) {
        try {
          issuerAddress = await BlockchainService.getIssuer(computedHash);
        } catch (error) {
          console.log("[VerifierController] Could not retrieve issuer from blockchain");
        }
      }

      if (!issuerAddress) {
        return res.status(400).json({
          success: false,
          message: "Issuer address not found in credential or blockchain"
        });
      }

      // Verify signature
      const signatureValid = CryptoService.verifySignature(
        computedHash,
        signature,
        issuerAddress
      );

      console.log("[VerifierController] Signature valid:", signatureValid);

      // Verify on blockchain
      let blockchainValid = false;
      let blockchainData = null;
      let blockchainError = null;

      try {
        await BlockchainService.initialize();
        blockchainValid = await BlockchainService.verifyOnChain(computedHash);
        
        if (blockchainValid) {
          blockchainData = await BlockchainService.getCredentialData(computedHash);
        }

        console.log("[VerifierController] Blockchain valid:", blockchainValid);
      } catch (error) {
        console.log("[VerifierController] Blockchain verification error:", error.message);
        blockchainError = error.message;
      }

      // Determine overall validity
      // If blockchain not available, only check signature
      const blockchainAvailable = !blockchainError;
      const isValid = blockchainAvailable 
        ? (signatureValid && blockchainValid)
        : signatureValid;

      console.log("[VerifierController] Overall validity:", isValid);

      res.json({
        success: true,
        isValid,
        credentialHash: computedHash,
        verification: {
          signatureValid,
          issuerAddress,
          blockchainValid,
          blockchainAvailable,
          blockchainData,
          credential: {
            studentName: credential.studentName,
            degree: credential.degree,
            year: credential.year,
            issuedAt: credential.issuedAt
          },
          verifiedAt: new Date().toISOString()
        },
        details: {
          message: isValid ? "Credential is valid" : "Credential validation failed",
          checks: {
            signature: signatureValid ? "✓ Valid" : "✗ Invalid",
            blockchain: blockchainAvailable 
              ? (blockchainValid ? "✓ Registered" : "✗ Not registered")
              : "⊘ Not available"
          }
        }
      });

    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify credential",
        error: error.message
      });
    }
  }

  /**
   * Batch verify multiple credentials
   * 
   * POST /api/verify/batch
   * Body: {
   *   "credentials": [
   *     { credential, signature },
   *     ...
   *   ]
   * }
   */
  static async batchVerify(req, res) {
    try {
      console.log("[VerifierController] Received batch verification request");

      const { credentials } = req.body;

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return res.status(400).json({
          success: false,
          message: "credentials array required and must not be empty"
        });
      }

      const results = [];

      for (const { credential, signature } of credentials) {
        try {
          const hash = CryptoService.hashCredential(credential);
          const issuerAddress = credential.issuerAddress;

          const signatureValid = CryptoService.verifySignature(hash, signature, issuerAddress);

          results.push({
            credentialHash: hash,
            signatureValid,
            studentName: credential.studentName,
            degree: credential.degree
          });
        } catch (error) {
          results.push({
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        totalVerified: results.length,
        results
      });

    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify credentials"
      });
    }
  }

  /**
   * Get credential details from hash
   * 
   * GET /api/verify/credential/:hash
   */
  static async getCredentialDetails(req, res) {
    try {
      console.log("[VerifierController] Getting credential details");

      const { hash } = req.params;

      // Try from blockchain
      let details = null;

      try {
        await BlockchainService.initialize();
        details = await BlockchainService.getCredentialData(hash);
      } catch (error) {
        console.log("[VerifierController] Could not fetch from blockchain");
      }

      if (!details) {
        return res.status(404).json({
          success: false,
          message: "Credential details not found"
        });
      }

      res.json({
        success: true,
        credentialHash: hash,
        details
      });

    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get credential details"
      });
    }
  }

  /**
   * Verify issuer authenticity
   * 
   * POST /api/verify/issuer
   * Body: {
   *   "issuerAddress": "0x...",
   *   "credentialHash": "0x..."
   * }
   */
  static async verifyIssuer(req, res) {
    try {
      console.log("[VerifierController] Verifying issuer");

      const { issuerAddress, credentialHash } = req.body;

      if (!issuerAddress || !credentialHash) {
        return res.status(400).json({
          success: false,
          message: "issuerAddress and credentialHash required"
        });
      }

      // Validate address format
      if (!CryptoService.isValidAddress(issuerAddress)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Ethereum address format"
        });
      }

      // Get issuer from blockchain
      let actualIssuer = null;

      try {
        await BlockchainService.initialize();
        actualIssuer = await BlockchainService.getIssuer(credentialHash);
      } catch (error) {
        console.log("[VerifierController] Could not fetch issuer from blockchain");
      }

      const isMatchIssuer = actualIssuer && 
        actualIssuer.toLowerCase() === issuerAddress.toLowerCase();

      res.json({
        success: true,
        issuerAddress,
        isVerifiedIssuer: isMatchIssuer,
        actualIssuer: actualIssuer || "Not found on blockchain",
        verificationTime: new Date().toISOString()
      });

    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify issuer"
      });
    }
  }

  /**
   * Get verification report
   * 
   * POST /api/verify/report
   * Body: {
   *   "credential": { ... },
   *   "signature": "0x..."
   * }
   */
  static async getVerificationReport(req, res) {
    try {
      console.log("[VerifierController] Generating verification report");

      const { credential, signature } = req.body;

      if (!credential || !signature) {
        return res.status(400).json({
          success: false,
          message: "credential and signature required"
        });
      }

      const hash = CryptoService.hashCredential(credential);
      const issuerAddress = credential.issuerAddress;

      // Signature verification
      const signatureValid = CryptoService.verifySignature(hash, signature, issuerAddress);

      // Blockchain verification
      let blockchainData = null;
      let blockchainValid = false;

      try {
        await BlockchainService.initialize();
        blockchainValid = await BlockchainService.verifyOnChain(hash);
        if (blockchainValid) {
          blockchainData = await BlockchainService.getCredentialData(hash);
        }
      } catch (error) {
        console.log("[VerifierController] Blockchain check not available");
      }

      // Compile report
      const report = {
        reportId: crypto.randomUUID || (() => Math.random().toString(36))(),
        reportDate: new Date().toISOString(),
        credential: {
          hash,
          type: credential.degree || "Unknown",
          student: credential.studentName,
          issuer: issuerAddress
        },
        verification: {
          overallStatus: signatureValid && blockchainValid ? "VALID" : "INVALID",
          signatureVerification: {
            status: signatureValid ? "PASS" : "FAIL",
            timestamp: new Date().toISOString()
          },
          blockchainVerification: {
            status: blockchainValid ? "PASS" : blockchainData ? "FAIL" : "UNAVAILABLE",
            data: blockchainData
          }
        }
      };

      res.json({
        success: true,
        report
      });

    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate verification report",
        error: error.message
      });
    }
  }
}

module.exports = VerifierController;
