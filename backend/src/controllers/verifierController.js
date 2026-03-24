/**
 * Verifier Controller
 *
 * Handles credential verification and reporting.
 */

const { randomUUID } = require("crypto");
const BlockchainService = require("../services/blockchainService");
const CryptoService = require("../services/cryptoService");
const DidService = require("../services/didService");

class VerifierController {
  static parseVerificationPayload(body) {
    const wrappedCredential = body?.verifiableCredential;

    if (wrappedCredential?.proof?.jws) {
      return {
        verifiableCredential: wrappedCredential,
        signature: wrappedCredential.proof.jws,
        providedHash: wrappedCredential.proof.blockchainHash,
      };
    }

    if (body?.proof?.jws && body?.credentialSubject) {
      return {
        verifiableCredential: body,
        signature: body.proof.jws,
        providedHash: body.proof.blockchainHash,
      };
    }

    if (body?.credential && body?.signature) {
      return {
        legacyCredential: body.credential,
        signature: body.signature,
        providedHash: body.credentialHash,
      };
    }

    return null;
  }

  static resolveIssuerAddress(verifiableCredential, legacyCredential) {
    if (verifiableCredential?.issuer?.id) {
      return DidService.fromDid(verifiableCredential.issuer.id);
    }

    if (legacyCredential?.issuerAddress) {
      return legacyCredential.issuerAddress;
    }

    return null;
  }

  static async verifyCredential(req, res) {
    try {
      console.log("[VerifierController] Received credential verification request");

      const parsedPayload = VerifierController.parseVerificationPayload(req.body);

      if (!parsedPayload) {
        return res.status(400).json({
          success: false,
          message: "Missing required VC fields or legacy credential payload",
        });
      }

      const { verifiableCredential, legacyCredential, signature, providedHash } = parsedPayload;
      const computedHash = verifiableCredential
        ? CryptoService.hashVerifiableCredential(verifiableCredential)
        : CryptoService.hashCredential(legacyCredential);

      if (providedHash && providedHash !== computedHash) {
        return res.status(400).json({
          success: false,
          message: "Provided hash does not match computed hash",
          computedHash,
        });
      }

      let issuerAddress = VerifierController.resolveIssuerAddress(
        verifiableCredential,
        legacyCredential
      );

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
          message: "Issuer address not found in credential or blockchain",
        });
      }

      const signatureValid = CryptoService.verifySignature(
        computedHash,
        signature,
        issuerAddress
      );

      let blockchainValid = false;
      let blockchainData = null;
      let blockchainError = null;

      try {
        await BlockchainService.initialize();
        blockchainValid = await BlockchainService.verifyOnChain(computedHash);

        if (blockchainValid) {
          blockchainData = await BlockchainService.getCredentialData(computedHash);
        }
      } catch (error) {
        blockchainError = error.message;
      }

      const blockchainAvailable = !blockchainError;
      const isValid = blockchainAvailable
        ? signatureValid && blockchainValid
        : signatureValid;

      const vcSubject = verifiableCredential?.credentialSubject || {};

      res.json({
        success: true,
        isValid,
        credentialHash: computedHash,
        verification: {
          signatureValid,
          issuerAddress,
          issuerDid: verifiableCredential?.issuer?.id || null,
          blockchainValid,
          blockchainAvailable,
          blockchainData,
          credential: {
            studentName: vcSubject.studentName || legacyCredential?.studentName,
            degree: vcSubject.degree || legacyCredential?.degree,
            year: vcSubject.year || legacyCredential?.year,
            issuedAt: verifiableCredential?.issuanceDate || legacyCredential?.issuedAt,
            subjectDid: vcSubject.id || null,
          },
          verifiedAt: new Date().toISOString(),
        },
        details: {
          message: isValid ? "Credential is valid" : "Credential validation failed",
          checks: {
            signature: signatureValid ? "PASS" : "FAIL",
            blockchain: blockchainAvailable
              ? (blockchainValid ? "PASS" : "FAIL")
              : "UNAVAILABLE",
          },
          proof: verifiableCredential?.proof?.type || "Legacy signature",
        },
        verifiableCredential: verifiableCredential || null,
      });
    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify credential",
        error: error.message,
      });
    }
  }

  static async batchVerify(req, res) {
    try {
      const { credentials } = req.body;

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return res.status(400).json({
          success: false,
          message: "credentials array required and must not be empty",
        });
      }

      const results = [];

      for (const payload of credentials) {
        try {
          const parsed = VerifierController.parseVerificationPayload(payload);

          if (!parsed) {
            results.push({ error: "Invalid credential payload" });
            continue;
          }

          const { verifiableCredential, legacyCredential, signature } = parsed;
          const hash = verifiableCredential
            ? CryptoService.hashVerifiableCredential(verifiableCredential)
            : CryptoService.hashCredential(legacyCredential);
          const issuerAddress = VerifierController.resolveIssuerAddress(
            verifiableCredential,
            legacyCredential
          );
          const signatureValid = CryptoService.verifySignature(hash, signature, issuerAddress);

          results.push({
            credentialHash: hash,
            signatureValid,
            studentName:
              verifiableCredential?.credentialSubject?.studentName ||
              legacyCredential?.studentName,
            degree:
              verifiableCredential?.credentialSubject?.degree ||
              legacyCredential?.degree,
          });
        } catch (error) {
          results.push({ error: error.message });
        }
      }

      res.json({
        success: true,
        totalVerified: results.length,
        results,
      });
    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify credentials",
      });
    }
  }

  static async getCredentialDetails(req, res) {
    try {
      const { hash } = req.params;
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
          message: "Credential details not found",
        });
      }

      res.json({
        success: true,
        credentialHash: hash,
        details,
      });
    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get credential details",
      });
    }
  }

  static async verifyIssuer(req, res) {
    try {
      const { issuerAddress, credentialHash } = req.body;

      if (!issuerAddress || !credentialHash) {
        return res.status(400).json({
          success: false,
          message: "issuerAddress and credentialHash required",
        });
      }

      if (!CryptoService.isValidAddress(issuerAddress)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Ethereum address format",
        });
      }

      let actualIssuer = null;

      try {
        await BlockchainService.initialize();
        actualIssuer = await BlockchainService.getIssuer(credentialHash);
      } catch (error) {
        console.log("[VerifierController] Could not fetch issuer from blockchain");
      }

      const isMatchIssuer =
        actualIssuer && actualIssuer.toLowerCase() === issuerAddress.toLowerCase();

      res.json({
        success: true,
        issuerAddress,
        issuerDid: isMatchIssuer ? DidService.toDid(issuerAddress) : null,
        isVerifiedIssuer: isMatchIssuer,
        actualIssuer: actualIssuer || "Not found on blockchain",
        verificationTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify issuer",
      });
    }
  }

  static async getVerificationReport(req, res) {
    try {
      const parsedPayload = VerifierController.parseVerificationPayload(req.body);

      if (!parsedPayload) {
        return res.status(400).json({
          success: false,
          message: "credential payload required",
        });
      }

      const { verifiableCredential, legacyCredential, signature } = parsedPayload;
      const hash = verifiableCredential
        ? CryptoService.hashVerifiableCredential(verifiableCredential)
        : CryptoService.hashCredential(legacyCredential);
      const issuerAddress = VerifierController.resolveIssuerAddress(
        verifiableCredential,
        legacyCredential
      );
      const signatureValid = CryptoService.verifySignature(hash, signature, issuerAddress);

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

      res.json({
        success: true,
        report: {
          reportId: randomUUID(),
          reportDate: new Date().toISOString(),
          credential: {
            hash,
            type:
              verifiableCredential?.type?.[1] ||
              legacyCredential?.degree ||
              "Unknown",
            student:
              verifiableCredential?.credentialSubject?.studentName ||
              legacyCredential?.studentName,
            issuer: verifiableCredential?.issuer?.id || issuerAddress,
          },
          verification: {
            overallStatus: signatureValid && blockchainValid ? "VALID" : "INVALID",
            signatureVerification: {
              status: signatureValid ? "PASS" : "FAIL",
              timestamp: new Date().toISOString(),
            },
            blockchainVerification: {
              status: blockchainValid ? "PASS" : blockchainData ? "FAIL" : "UNAVAILABLE",
              data: blockchainData,
            },
          },
        },
      });
    } catch (error) {
      console.error("[VerifierController] Error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate verification report",
        error: error.message,
      });
    }
  }
}

module.exports = VerifierController;
