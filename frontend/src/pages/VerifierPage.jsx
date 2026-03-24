import React, { useState } from "react";
import { verifierAPI } from "../services/api";
import UploadBox from "../components/UploadBox";
import "./VerifierPage.css";

function VerifierPage() {
  const [credential, setCredential] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file upload
  const handleFileUpload = async (file) => {
    setError(null);
    setVerification(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.credential || !data.signature) {
        throw new Error("Invalid credential file format");
      }

      setCredential(data);
    } catch (err) {
      setError("Invalid credential file: " + err.message);
    }
  };

  // Verify credential
  const handleVerify = async () => {
    if (!credential) return;

    setLoading(true);
    setError(null);

    try {
      // Small delay to showcase smooth loading animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await verifierAPI.verifyCredential(
        credential.credential,
        credential.signature,
        credential.credentialHash
      );

      setVerification(response);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verifier-page container mt-20">
      <div className="header">
        <h1>🔍 Verification Portal</h1>
        <p>Instantly cryptographically verify academic credentials anchored on the blockchain.</p>
      </div>

      <div className="verifier-layout">
        {/* Upload Section */}
        <div className="upload-section glass-panel">
          <h2>Step 1: Upload Credential</h2>
          <UploadBox onFileUpload={handleFileUpload} />
        </div>

        {/* Credential Preview */}
        {credential && !verification && (
          <div className="preview-section glass-panel">
            <h2>Step 2: Review Credential</h2>
            <div className="preview-card">
              <div className="preview-row">
                <span className="label">Student Name</span>
                <span className="value">{credential.credential.studentName}</span>
              </div>
              <div className="preview-row">
                <span className="label">Degree</span>
                <span className="value">{credential.credential.degree}</span>
              </div>
              <div className="preview-row">
                <span className="label">Year</span>
                <span className="value">{credential.credential.year}</span>
              </div>
              <div className="preview-row">
                <span className="label">Credential Type</span>
                <span className="value">{credential.credentialType || "Academic"}</span>
              </div>
              <div className="preview-row">
                <span className="label">Hash Data</span>
                <code>{credential.credentialHash.substring(0, 24)}...</code>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="spinner" style={{ animation: 'spin 1s linear infinite' }}>⏳</span> Verifying Ledger...
                </span>
              ) : "✅ Cryptographically Verify"}
            </button>
          </div>
        )}

        {/* Verification Result */}
        {verification && (
          <div className="result-section glass-panel">
            <h2>Step 3: Verification Result</h2>

            <div
              className={`verification-status ${verification.isValid ? 'status-valid' : 'status-invalid'}`}
            >
              <div className="status-icon">
                {verification.isValid ? "✅" : "❌"}
              </div>
              <div className="status-message">
                <h3>{verification.isValid ? "AUTHENTIC" : "INVALID"}</h3>
                <p>{verification.details?.message || "Verification complete."}</p>
              </div>
            </div>

            <div className="verification-details">
              <div className="detail-group">
                <h4>Verification Engine</h4>
                <ul>
                  <li>
                    <span className="check-label">Signature Logic</span>
                    <span className="check-value" style={{ color: verification.details?.checks?.signature === 'Valid' ? 'var(--success)' : 'inherit' }}>
                      {verification.details?.checks?.signature}
                    </span>
                  </li>
                  <li>
                    <span className="check-label">Blockchain Anchor</span>
                    <span className="check-value" style={{ color: verification.details?.checks?.blockchain === 'Valid' ? 'var(--success)' : 'inherit' }}>
                      {verification.details?.checks?.blockchain}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="detail-group">
                <h4>Identity Details</h4>
                <ul>
                  <li>
                    <span className="label">Student</span>
                    <span className="value">
                      {verification.verification?.credential?.studentName}
                    </span>
                  </li>
                  <li>
                    <span className="label">Issuer Address</span>
                    <code>{verification.verification?.issuerAddress?.substring(0, 16)}...</code>
                  </li>
                  <li>
                    <span className="label">Verified At</span>
                    <span className="value text-muted" style={{ fontSize: '0.9rem' }}>
                      {verification.verification?.verifiedAt && new Date(verification.verification.verifiedAt).toLocaleString()}
                    </span>
                  </li>
                </ul>
              </div>

              {verification.verification?.blockchainData && (
                <div className="detail-group">
                  <h4>Ledger Data</h4>
                  <ul>
                    <li>
                      <span className="label">Anchored At</span>
                      <span className="value text-muted" style={{ fontSize: '0.9rem' }}>
                        {new Date(
                          verification.verification.blockchainData.issuedAt * 1000
                        ).toLocaleString()}
                      </span>
                    </li>
                    <li>
                      <span className="label">Revoked Status</span>
                      <span className="value">
                        {verification.verification.blockchainData.revoked
                          ? <span style={{ color: 'var(--error)' }}>Revoked ❌</span>
                          : <span style={{ color: 'var(--success)' }}>Active ✅</span>}
                      </span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setCredential(null);
                setVerification(null);
                setError(null);
              }}
              className="btn-secondary"
            >
              🔄 Verify Another Credential
            </button>
          </div>
        )}

        {error && <div className="error-box mt-20 glass-panel">{error}</div>}
      </div>
    </div>
  );
}

export default VerifierPage;
