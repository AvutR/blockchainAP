/**
 * Verifier Page
 * 
 * Verification portal for validating credentials
 */

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

  // Get status color
  const getStatusColor = (isValid) => {
    return isValid ? "#22c55e" : "#ef4444";
  };

  return (
    <div className="verifier-page">
      <div className="container">
        <div className="header">
          <h1>🔍 Verification Portal</h1>
          <p>Verify academic credentials on the blockchain</p>
        </div>

        <div className="verifier-layout">
          {/* Upload Section */}
          <div className="upload-section">
            <h2>Step 1: Upload Credential</h2>
            <UploadBox onFileUpload={handleFileUpload} />
          </div>

          {/* Credential Preview */}
          {credential && (
            <div className="preview-section">
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
                  <span className="value">{credential.credentialType}</span>
                </div>
                <div className="preview-row">
                  <span className="label">Hash</span>
                  <code>{credential.credentialHash.substring(0, 20)}...</code>
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "⏳ Verifying..." : "✅ Verify Credential"}
              </button>
            </div>
          )}

          {/* Verification Result */}
          {verification && (
            <div className="result-section">
              <h2>Step 3: Verification Result</h2>

              <div
                className="verification-status"
                style={{
                  borderColor: getStatusColor(verification.isValid)
                }}
              >
                <div className="status-icon">
                  {verification.isValid ? "✅" : "❌"}
                </div>
                <div className="status-message">
                  <h3>{verification.isValid ? "VALID" : "INVALID"}</h3>
                  <p>{verification.details.message}</p>
                </div>
              </div>

              <div className="verification-details">
                <div className="detail-group">
                  <h4>Verification Checks</h4>
                  <ul>
                    <li>
                      <span className="check-label">Signature</span>
                      <span className="check-value">
                        {verification.details.checks.signature}
                      </span>
                    </li>
                    <li>
                      <span className="check-label">Blockchain</span>
                      <span className="check-value">
                        {verification.details.checks.blockchain}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="detail-group">
                  <h4>Credential Details</h4>
                  <ul>
                    <li>
                      <span className="label">Student</span>
                      <span className="value">
                        {verification.verification.credential.studentName}
                      </span>
                    </li>
                    <li>
                      <span className="label">Issuer</span>
                      <code>{verification.verification.issuerAddress}</code>
                    </li>
                    <li>
                      <span className="label">Verified At</span>
                      <span className="value">
                        {new Date(
                          verification.verification.verifiedAt
                        ).toLocaleString()}
                      </span>
                    </li>
                  </ul>
                </div>

                {verification.verification.blockchainData && (
                  <div className="detail-group">
                    <h4>Blockchain Data</h4>
                    <ul>
                      <li>
                        <span className="label">Issued At</span>
                        <span className="value">
                          {new Date(
                            verification.verification.blockchainData.issuedAt * 1000
                          ).toLocaleString()}
                        </span>
                      </li>
                      <li>
                        <span className="label">Revoked</span>
                        <span className="value">
                          {verification.verification.blockchainData.revoked
                            ? "Yes ❌"
                            : "No ✅"}
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
                }}
                className="btn-secondary"
              >
                🔄 Verify Another Credential
              </button>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default VerifierPage;
