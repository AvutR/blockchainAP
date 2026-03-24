/**
 * Express Application Setup
 * 
 * Main entry point for backend server
 * Sets up routes, middleware, and error handling
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import routes
const issuerRoutes = require("./routes/issuerRoutes");
const walletRoutes = require("./routes/walletRoutes");
const verifierRoutes = require("./routes/verifierRoutes");

// Import services
const BlockchainService = require("./services/blockchainService");

// Create Express app
const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "SSI Sepolia Backend",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use("/api/issuer", issuerRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/verify", verifierRoutes);

// ============================================================================
// BLOCKCHAIN STATUS ENDPOINT
// ============================================================================

app.get("/api/blockchain/status", async (req, res) => {
  try {
    await BlockchainService.initialize();

    const networkInfo = await BlockchainService.getNetworkInfo();
    const balance = await BlockchainService.getSignerBalance();
    const gasPrice = await BlockchainService.getGasPrice();

    res.json({
      success: true,
      blockchain: {
        network: networkInfo,
        balance: balance + " ETH",
        gasPrice: gasPrice + " Gwei",
        signerAddress: BlockchainService.signer.address
      }
    });
  } catch (error) {
    console.error("Blockchain status check failed:", error);
    res.status(500).json({
      success: false,
      message: "Blockchain not available",
      error: error.message
    });
  }
});

// ============================================================================
// 404 HANDLER
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
    method: req.method
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

app.use((err, req, res, next) => {
  console.error("[Error]", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log("🚀 SSI Sepolia Backend Server Started");
  console.log("════════════════════════════════════════════════════════════════");
  console.log(`📌 Server running on http://localhost:${PORT}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
  console.log("════════════════════════════════════════════════════════════════\n");

  // Initialize blockchain connection
  try {
    await BlockchainService.initialize();
    console.log("✅ Blockchain connection initialized\n");
  } catch (error) {
    console.warn("⚠️  Blockchain not initialized (will be initialized on first request)\n");
  }

  // Display available endpoints
  console.log("📋 Available Endpoints:\n");
  console.log("ISSUER:");
  console.log("  POST   /api/issuer/create-credential    - Create credential");
  console.log("  POST   /api/issuer/issue-credential     - Issue credential");
  console.log("  GET    /api/issuer/info                 - Get issuer info");
  console.log("  GET    /api/issuer/stats                - Get statistics\n");

  console.log("WALLET:");
  console.log("  POST   /api/wallet/store                - Store credential");
  console.log("  GET    /api/wallet/credentials          - Get credentials");
  console.log("  GET    /api/wallet/credential/:hash     - Get specific credential");
  console.log("  POST   /api/wallet/qr                   - Generate QR code");
  console.log("  GET    /api/wallet/download/:hash       - Download credential");
  console.log("  GET    /api/wallet/summary              - Get summary\n");

  console.log("VERIFIER:");
  console.log("  POST   /api/verify/validate-credential  - Verify credential");
  console.log("  POST   /api/verify/batch                - Batch verify");
  console.log("  GET    /api/verify/credential/:hash     - Get details");
  console.log("  POST   /api/verify/issuer               - Verify issuer");
  console.log("  POST   /api/verify/report               - Generate report\n");

  console.log("UTILITY:");
  console.log("  GET    /                                - Status check");
  console.log("  GET    /health                          - Health check");
  console.log("  GET    /api/blockchain/status           - Blockchain status\n");

  console.log("════════════════════════════════════════════════════════════════");
  console.log("📚 Documentation: See README.md for API details\n");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;
