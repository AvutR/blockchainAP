/**
 * Main App Component
 * Root component with routing and premium Home Page
 */

import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navigation from "./components/Navigation";
import IssuerPage from "./pages/IssuerPage";
import WalletPage from "./pages/WalletPage";
import VerifierPage from "./pages/VerifierPage";
import "./App.css";

function App() {
  
  // Example of adding entrance animations on scroll (simple observer implementation)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(40px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
                      <div className="badge-pill mb-10" style={{ 
                        display: 'inline-block', padding: '6px 16px', background: 'rgba(99, 102, 241, 0.1)', 
                        border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '30px', color: '#818cf8', fontWeight: '500', fontSize: '0.9rem' 
                      }}>
                        Version 2.0 Is Live
                      </div>
                      <h1>
                        Decentralized <span className="text-gradient-primary">Sovereign</span><br />
                        Student Identity
                      </h1>
                      <p>
                        A seamless, premium blockchain platform for issuing, storing, and instantly verifying academic credentials on the Sepolia network.
                      </p>

                      <div className="cta-buttons">
                        <Link to="/issuer" className="btn btn-primary">
                          <span style={{fontSize: '1.2rem'}}>🏫</span> Issue Credentials
                        </Link>
                        <Link to="/wallet" className="btn btn-secondary">
                          <span style={{fontSize: '1.2rem'}}>👤</span> Manage Wallet
                        </Link>
                      </div>
                    </div>

                    <div className="features animate-on-scroll">
                      <h2>Next-Generation Features</h2>
                      <div className="features-grid">
                        <div className="feature glass-panel">
                          <div className="feature-icon">🔐</div>
                          <h3>Cryptographically Secure</h3>
                          <p>Industry-standard ECDSA signatures guarantee absolute authenticity and prevent any tampering of records.</p>
                        </div>

                        <div className="feature glass-panel">
                          <div className="feature-icon">⛓️</div>
                          <h3>Immutable Records</h3>
                          <p>Every credential hash is permanently anchored on the Sepolia Ethereum testnet for lifetime accessibility.</p>
                        </div>

                        <div className="feature glass-panel">
                          <div className="feature-icon">🔑</div>
                          <h3>True Sovereignty</h3>
                          <p>Give students absolute control over their data, maintaining true ownership without centralized platforms.</p>
                        </div>
                      </div>
                    </div>

                    <div className="workflow animate-on-scroll mt-20">
                      <h2>Elegant Workflow</h2>
                      <div className="workflow-steps">
                        <div className="step glass-panel">
                          <div className="step-number">1</div>
                          <h3>Issue</h3>
                          <p>Institution creates a credential</p>
                        </div>

                        <div className="arrow">→</div>

                        <div className="step glass-panel">
                          <div className="step-number">2</div>
                          <h3>Anchor</h3>
                          <p>Signed hash is stored on-chain</p>
                        </div>

                        <div className="arrow">→</div>

                        <div className="step glass-panel">
                          <div className="step-number">3</div>
                          <h3>Verify</h3>
                          <p>Instant, one-click verification</p>
                        </div>
                      </div>
                    </div>

                    <div className="info-section animate-on-scroll mt-20 text-center">
                      <div className="glass-panel" style={{ padding: '50px', maxWidth: '800px', margin: '0 auto' }}>
                        <h2>The Technology</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                          Built on cutting-edge Web3 principles, offering a fluid, luxurious user experience 
                          while maintaining military-grade cryptographic security under the hood. 
                          Experience the future of academic verification today.
                        </p>
                        <div className="mt-20">
                           <Link to="/verify" className="btn btn-primary">
                             Experience Verification
                           </Link>
                        </div>
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
                  <div className="error-page glass-panel" style={{ marginTop: '100px' }}>
                    <h1>404</h1>
                    <p>The page you are looking for does not exist in this realm.</p>
                    <Link to="/" className="btn btn-primary mt-20">Return Home</Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>

        <footer className="footer">
          <p>
            🎓 SSI Sepolia • Engineered for premium decentralized experiences •{" "}
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
