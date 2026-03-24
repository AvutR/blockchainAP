/**
 * Issuer Routes
 * 
 * Routes for credential issuance
 */

const express = require("express");
const router = express.Router();
const IssuerController = require("../controllers/issuerController");

/**
 * POST /api/issuer/create-credential
 * Create a new credential (without blockchain registration)
 */
router.post("/create-credential", IssuerController.createCredential);

/**
 * POST /api/issuer/issue-credential
 * Issue a credential (create + register on blockchain)
 */
router.post("/issue-credential", IssuerController.issueCredential);

/**
 * GET /api/issuer/info
 * Get issuer information
 */
router.get("/info", IssuerController.getIssuerInfo);

/**
 * GET /api/issuer/stats
 * Get issuance statistics
 */
router.get("/stats", IssuerController.getStats);

module.exports = router;
