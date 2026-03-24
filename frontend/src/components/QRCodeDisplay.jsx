/**
 * QR Code Display Component
 * 
 * Display QR code for credential
 */

import React, { useState, useEffect } from "react";
import { walletAPI } from "../services/api";
import "./QRCodeDisplay.css";

function QRCodeDisplay({ credential, onClose }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const response = await walletAPI.generateQR(credential.credentialHash);
        setQrCode(response.qrCode);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [credential]);

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <h2>📱 QR Code</h2>

        <div className="credential-info">
          <p>
            <strong>{credential.studentName}</strong>
          </p>
          <p className="degree">{credential.degree}</p>
          <p className="year">Graduated: {credential.year}</p>
        </div>

        {loading ? (
          <div className="loading">Generating QR code...</div>
        ) : qrCode ? (
          <div className="qr-container">
            <img src={qrCode} alt="Credential QR Code" className="qr-image" />
            <p className="hint">
              Share this QR code with verifiers to let them scan your credential
            </p>
          </div>
        ) : (
          <div className="error">Failed to generate QR code</div>
        )}

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRCodeDisplay;
