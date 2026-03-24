/**
 * Main App Component
 * 
 * Root component with routing
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import IssuerPage from "./pages/IssuerPage";
import WalletPage from "./pages/WalletPage";
import VerifierPage from "./pages/VerifierPage";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <div className="home-page">
                  <div className="container">
                    <div className="hero">
                      <h1>🎓 SSI Sepolia</h1>
                      <p>Decentralized Self-Sovereign Student Identity System</p>

                      <div className="hero-description">
                        <p>
                          A blockchain-based platform for creating, storing, and verifying
                          academic credentials using Ethereum's Sepolia testnet.
                        </p>
                      </div>

                      <div className="cta-buttons">
                        <a href="/issuer" className="btn btn-primary">
                          🏫 Issue Credentials
                        </a>
                        <a href="/wallet" className="btn btn-secondary">
                          👤 Manage Wallet
                        </a>
                        <a href="/verify" className="btn btn-secondary">
                          🔍 Verify Credentials
                        </a>
                      </div>
                    </div>

                    <div className="features">
                      <h2>Key Features</h2>
                      <div className="features-grid">
                        <div className="feature">
                          <div className="feature-icon">🔐</div>
                          <h3>Cryptographically Secure</h3>
                          <p>ECDSA signatures ensure credential authenticity</p>
                        </div>

                        <div className="feature">
                          <div className="feature-icon">⛓️</div>
                          <h3>Blockchain Verified</h3>
                          <p>Credentials anchored on Sepolia for permanence</p>
                        </div>

                        <div className="feature">
                          <div className="feature-icon">🔑</div>
                          <h3>Self-Sovereign</h3>
                          <p>Students own their credentials completely</p>
                        </div>

                        <div className="feature">
                          <div className="feature-icon">✅</div>
                          <h3>Instant Verification</h3>
                          <p>Verifiers can validate credentials in seconds</p>
                        </div>

                        <div className="feature">
                          <div className="feature-icon">🌐</div>
                          <h3>Web3 Native</h3>
                          <p>Built on modern blockchain standards</p>
                        </div>

                        <div className="feature">
                          <div className="feature-icon">📲</div>
                          <h3>QR Code Sharing</h3>
                          <p>Share credentials easily via QR codes</p>
                        </div>
                      </div>
                    </div>

                    <div className="workflow">
                      <h2>How It Works</h2>
                      <div className="workflow-steps">
                        <div className="step">
                          <div className="step-number">1</div>
                          <h3>Issuer Creates</h3>
                          <p>University issues credential</p>
                        </div>

                        <div className="arrow">→</div>

                        <div className="step">
                          <div className="step-number">2</div>
                          <h3>Sign & Hash</h3>
                          <p>Credential is signed and hashed</p>
                        </div>

                        <div className="arrow">→</div>

                        <div className="step">
                          <div className="step-number">3</div>
                          <h3>Store On-Chain</h3>
                          <p>Hash registered on Sepolia</p>
                        </div>

                        <div className="arrow">→</div>

                        <div className="step">
                          <div className="step-number">4</div>
                          <h3>Student Stores</h3>
                          <p>Credential saved to wallet</p>
                        </div>

                        <div className="arrow">→</div>

                        <div className="step">
                          <div className="step-number">5</div>
                          <h3>Verifier Checks</h3>
                          <p>Anyone can verify instantly</p>
                        </div>
                      </div>
                    </div>

                    <div className="info-section">
                      <h2>About This Project</h2>
                      <p>
                        This system implements Self-Sovereign Identity (SSI) principles,
                        allowing students to maintain tamper-proof, verifiable academic
                        credentials without relying on a central authority. Credentials are
                        cryptographically signed by issuers and permanently anchored on the
                        Ethereum blockchain.
                      </p>
                      <div className="tech-stack">
                        <h3>Tech Stack</h3>
                        <ul>
                          <li>⛓️ Solidity Smart Contracts</li>
                          <li>🔗 Sepolia Testnet</li>
                          <li>🛠️ ethers.js for Web3</li>
                          <li>📦 Node.js Backend</li>
                          <li>⚛️ React Frontend</li>
                          <li>🔐 ECDSA Cryptography</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            <Route path="/issuer" element={<IssuerPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/verify" element={<VerifierPage />} />

            <Route
              path="*"
              element={
                <div className="container">
                  <div className="error-page">
                    <h1>404 - Page Not Found</h1>
                    <a href="/">← Go Home</a>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        <footer className="footer">
          <p>
            🎓 SSI Sepolia • Built for decentralized academic credentials •{" "}
            <a href="https://sepolia.etherscan.io/" target="_blank" rel="noopener noreferrer">
              View on Etherscan
            </a>
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
