import React, { useState, useEffect } from "react";
import { walletAPI } from "../services/api";
import CredentialCard from "../components/CredentialCard";
import QRCodeDisplay from "../components/QRCodeDisplay";
import "./WalletPage.css";

const fetchWalletCredentials = async (userId) => walletAPI.getCredentials(userId);

function WalletPage() {
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const loadCredentials = async (targetUserId = userId) => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      const response = await fetchWalletCredentials(targetUserId);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      // Simulate slight delay for smooth animation
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    localStorage.setItem("userId", userId);

    const syncCredentials = async () => {
      setLoading(true);
      try {
        const response = await fetchWalletCredentials(userId);
        setCredentials(response.credentials || []);
      } catch (error) {
        console.error("Error fetching credentials:", error);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };

    syncCredentials();
  }, [userId]);

  // Handle user ID change
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
  };

  // Download credential
  const handleDownload = async (hash) => {
    try {
      const response = await walletAPI.downloadCredential(hash);
      const dataStr = JSON.stringify(response, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `credential-${hash.substring(0, 8)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading credential:", error);
    }
  };

  // Show QR
  const handleShowQR = (credential) => {
    setSelectedCredential(credential);
    setShowQR(true);
  };

  return (
    <div className="wallet-page container mt-20">
      <div className="header">
        <h1>👤 Student Wallet</h1>
        <p>A secure vault to view, manage, and cryptographically share your credentials.</p>
      </div>

      <div className="user-section glass-panel">
        <label>Access Wallet Identity</label>
        <div className="user-input-group">
          <input
            type="text"
            value={userId}
            onChange={handleUserIdChange}
            placeholder="Student ID / Credential ID / Credential Hash"
          />
          <button onClick={() => loadCredentials()} disabled={!userId || loading} className="btn-primary">
            {loading ? "🔄 Syncing..." : "🔓 Unlock"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading" style={{ animation: 'fadeIn 0.5s' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px', animation: 'spin 1.5s linear infinite' }}>⏳</div>
          Syncing with blockchain network...
        </div>
      )}

      {!loading && credentials.length === 0 && userId && (
        <div className="empty-state glass-panel" style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeUp 0.6s' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
          <p>No anchored credentials found for this identity.</p>
        </div>
      )}

      {!loading && credentials.length > 0 && (
        <div className="credentials-grid-container">
          <h2>Your Credentials <span style={{ opacity: 0.5, fontSize: '1.2rem', marginLeft: '10px' }}>({credentials.length})</span></h2>
          <div className="credentials-grid">
            {credentials.map((credential, idx) => (
              <div key={credential.id} style={{ animation: `fadeUp 0.5s ease ${idx * 0.1}s both` }}>
                <CredentialCard
                  credential={credential}
                  onDownload={handleDownload}
                  onQR={handleShowQR}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {showQR && selectedCredential && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <QRCodeDisplay
            credential={selectedCredential}
            onClose={() => setShowQR(false)}
          />
        </div>
      )}
    </div>
  );
}

export default WalletPage;
