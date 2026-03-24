/**
 * Wallet Page
 *
 * Student wallet for loading, downloading, and sharing credentials.
 */

import React, { useEffect, useState } from "react";
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
    if (!targetUserId) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWalletCredentials(targetUserId);
      setCredentials(response.credentials || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
    } finally {
      setLoading(false);
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
        setLoading(false);
      }
    };

    syncCredentials();
  }, [userId]);

  const handleDownload = async (hash) => {
    try {
      const response = await walletAPI.downloadCredential(hash);
      const dataBlob = new Blob([JSON.stringify(response, null, 2)], {
        type: "application/json",
      });
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

  const handleShowQR = (credential) => {
    setSelectedCredential(credential);
    setShowQR(true);
  };

  return (
    <div className="wallet-page">
      <div className="container">
        <div className="header">
          <h1>Student Wallet</h1>
          <p>Load credentials by wallet lookup ID, DID, credential ID, or credential hash.</p>
        </div>

        <div className="user-section">
          <label>Student ID / DID / Wallet Address / Credential ID / Credential Hash</label>
          <div className="user-input-group">
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter a DID, wallet address, student ID, credential ID, or credential hash"
            />
            <button
              onClick={() => loadCredentials()}
              disabled={!userId}
              className="btn-secondary"
            >
              Load
            </button>
          </div>
        </div>

        {loading && <div className="loading">Loading credentials...</div>}

        {!loading && credentials.length === 0 && userId && (
          <div className="empty-state">
            <p>No credentials found for this lookup value.</p>
          </div>
        )}

        {!loading && credentials.length > 0 && (
          <div className="credentials-grid">
            <h2>Your Credentials ({credentials.length})</h2>
            {credentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onDownload={handleDownload}
                onQR={handleShowQR}
              />
            ))}
          </div>
        )}

        {showQR && selectedCredential && (
          <QRCodeDisplay credential={selectedCredential} onClose={() => setShowQR(false)} />
        )}
      </div>
    </div>
  );
}

export default WalletPage;
