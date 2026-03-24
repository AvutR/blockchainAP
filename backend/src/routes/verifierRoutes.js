/**
 * Verifier Routes
 * 
 * Routes for credential verification
 */

const express = require("express");
const router = express.Router();
const VerifierController = require("../controllers/verifierController");

/**
 * POST /api/verify/validate-credential
 * Verify a credential (signature + blockchain)
 */
router.post("/validate-credential", VerifierController.verifyCredential);

/**
 * POST /api/verify/batch
 * Batch verify multiple credentials
 */
router.post("/batch", VerifierController.batchVerify);

/**
 * GET /api/verify/credential/:hash
 * Get credential details from blockchain
 */
router.get("/credential/:hash", VerifierController.getCredentialDetails);

/**
 * POST /api/verify/issuer
 * Verify issuer authenticity
 */
router.post("/issuer", VerifierController.verifyIssuer);

/**
 * POST /api/verify/report
 * Generate verification report
 */
router.post("/report", VerifierController.getVerificationReport);

module.exports = router;
