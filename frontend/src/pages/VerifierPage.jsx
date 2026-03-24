/**
 * Verifier Page
 *
 * Verification portal for W3C-style credentials and legacy exports.
 */

import React, { useState } from "react";
import { verifierAPI } from "../services/api";
import UploadBox from "../components/UploadBox";
import "./VerifierPage.css";

const normalizeCredentialPayload = (data) => {
  if (data?.verifiableCredential?.proof?.jws) {
    return {
      payload: data.verifiableCredential,
      preview: {
        studentName: data.verifiableCredential.credentialSubject?.studentName,
        degree: data.verifiableCredential.credentialSubject?.degree,
        year: data.verifiableCredential.credentialSubject?.year,
        subjectDid: data.verifiableCredential.credentialSubject?.id,
        issuerDid: data.verifiableCredential.issuer?.id,
        type: data.verifiableCredential.type?.[1],
        hash: data.verifiableCredential.proof?.blockchainHash,
        ipfsCid: data.verifiableCredential.proof?.storage?.cid,
      },
    };
  }

  if (data?.proof?.jws && data?.credentialSubject) {
    return {
      payload: data,
      preview: {
        studentName: data.credentialSubject?.studentName,
        degree: data.credentialSubject?.degree,
        year: data.credentialSubject?.year,
        subjectDid: data.credentialSubject?.id,
        issuerDid: data.issuer?.id,
        type: data.type?.[1],
        hash: data.proof?.blockchainHash,
        ipfsCid: data.proof?.storage?.cid,
      },
    };
  }

  if (data?.credential && data?.signature) {
    return {
      payload: data,
      preview: {
        studentName: data.credential?.studentName,
        degree: data.credential?.degree,
        year: data.credential?.year,
        subjectDid: null,
        issuerDid: null,
        type: data.credentialType,
        hash: data.credentialHash,
        ipfsCid: null,
      },
    };
  }

  throw new Error("Unsupported credential format");
};

function VerifierPage() {
  const [credential, setCredential] = useState(null);
  const [preview, setPreview] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setError(null);
    setVerification(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const normalized = normalizeCredentialPayload(data);

      setCredential(normalized.payload);
      setPreview(normalized.preview);
    } catch (err) {
      setError("Invalid credential file: " + err.message);
    }
  };

  const handleVerify = async () => {
    if (!credential) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifierAPI.verifyCredentialPayload(credential);
      setVerification(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isValid) => (isValid ? "#22c55e" : "#ef4444");

  return (
    <div className="verifier-page">
      <div className="container">
        <div className="header">
          <h1>Verification Portal</h1>
          <p>Upload a downloaded VC JSON file and validate DID, proof, and blockchain hash.</p>
        </div>

        <div className="verifier-layout">
          <div className="upload-section">
            <h2>Step 1: Upload Credential</h2>
            <UploadBox onFileUpload={handleFileUpload} />
          </div>

          {preview && (
            <div className="preview-section">
              <h2>Step 2: Review Credential</h2>
              <div className="preview-card">
                <div className="preview-row">
                  <span className="label">Student Name</span>
                  <span className="value">{preview.studentName}</span>
                </div>
                <div className="preview-row">
                  <span className="label">Degree</span>
                  <span className="value">{preview.degree}</span>
                </div>
                <div className="preview-row">
                  <span className="label">Year</span>
                  <span className="value">{preview.year}</span>
                </div>
                <div className="preview-row">
                  <span className="label">Credential Type</span>
                  <span className="value">{preview.type || "Legacy Credential"}</span>
                </div>
                {preview.subjectDid && (
                  <div className="preview-row">
                    <span className="label">Subject DID</span>
                    <code>{preview.subjectDid}</code>
                  </div>
                )}
                {preview.issuerDid && (
                  <div className="preview-row">
                    <span className="label">Issuer DID</span>
                    <code>{preview.issuerDid}</code>
                  </div>
                )}
                {preview.ipfsCid && (
                  <div className="preview-row">
                    <span className="label">IPFS CID</span>
                    <code>{preview.ipfsCid}</code>
                  </div>
                )}
                <div className="preview-row">
                  <span className="label">Hash</span>
                  <code>{preview.hash || "Computed during verification"}</code>
                </div>
              </div>

              <button onClick={handleVerify} disabled={loading} className="btn-primary">
                {loading ? "Verifying..." : "Verify Credential"}
              </button>
            </div>
          )}

          {verification && (
            <div className="result-section">
              <h2>Step 3: Verification Result</h2>

              <div
                className="verification-status"
                style={{ borderColor: getStatusColor(verification.isValid) }}
              >
                <div className="status-icon">{verification.isValid ? "VALID" : "INVALID"}</div>
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
                      <span className="check-label">Signature / Proof</span>
                      <span className="check-value">{verification.details.checks.signature}</span>
                    </li>
                    <li>
                      <span className="check-label">Blockchain</span>
                      <span className="check-value">{verification.details.checks.blockchain}</span>
                    </li>
                  </ul>
                </div>

                <div className="detail-group">
                  <h4>Credential Details</h4>
                  <ul>
                    <li>
                      <span className="label">Student</span>
                      <span className="value">{verification.verification.credential.studentName}</span>
                    </li>
                    <li>
                      <span className="label">Subject DID</span>
                      <code>{verification.verification.credential.subjectDid || "Not present"}</code>
                    </li>
                    <li>
                      <span className="label">Issuer</span>
                      <code>{verification.verification.issuerDid || verification.verification.issuerAddress}</code>
                    </li>
                    <li>
                      <span className="label">Verified At</span>
                      <span className="value">
                        {new Date(verification.verification.verifiedAt).toLocaleString()}
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
                          {verification.verification.blockchainData.revoked ? "Yes" : "No"}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setCredential(null);
                  setPreview(null);
                  setVerification(null);
                }}
                className="btn-secondary"
              >
                Verify Another Credential
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
