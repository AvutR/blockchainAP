/**
 * Wallet Routes
 * 
 * Routes for student wallet operations
 */

const express = require("express");
const router = express.Router();
const WalletController = require("../controllers/walletController");

/**
 * POST /api/wallet/store
 * Store a credential in student wallet
 */
router.post("/store", WalletController.storeCredential);

/**
 * GET /api/wallet/credentials
 * Get all credentials for a student
 */
router.get("/credentials", WalletController.getCredentials);

/**
 * GET /api/wallet/credential/:hash
 * Get specific credential by hash
 */
router.get("/credential/:hash", WalletController.getCredential);

/**
 * POST /api/wallet/qr
 * Generate QR code for credential
 */
router.post("/qr", WalletController.generateQR);

/**
 * GET /api/wallet/download/:hash
 * Download credential as JSON
 */
router.get("/download/:hash", WalletController.downloadCredential);

/**
 * GET /api/wallet/summary
 * Get wallet summary for user
 */
router.get("/summary", WalletController.getSummary);

module.exports = router;
