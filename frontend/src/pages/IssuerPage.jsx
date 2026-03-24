/**
 * Issuer Page
 *
 * University/issuer dashboard for creating W3C-style credentials.
 */

import React, { useEffect, useState } from "react";
import { issuerAPI } from "../services/api";
import "./IssuerPage.css";

function IssuerPage() {
  const [formData, setFormData] = useState({
    studentName: "",
    studentWalletAddress: "",
    studentId: "",
    degree: "",
    year: new Date().getFullYear(),
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [issuerInfo, setIssuerInfo] = useState(null);

  useEffect(() => {
    const fetchIssuerInfo = async () => {
      try {
        const info = await issuerAPI.getInfo();
        setIssuerInfo(info);
      } catch (err) {
        console.error("Error fetching issuer info:", err);
      }
    };

    fetchIssuerInfo();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: name === "year" ? parseInt(value, 10) : value,
    }));
  };

  const handleIssueCredential = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await issuerAPI.issueCredential({
        studentName: formData.studentName,
        studentWalletAddress: formData.studentWalletAddress,
        studentId: formData.studentId || formData.studentWalletAddress,
        degree: formData.degree,
        year: formData.year,
      });

      setResult({
        credentialId: response.credentialId,
        studentId: response.studentId,
        hash: response.credentialHash,
        tx: response.blockchainTx,
        subjectDid: response.verifiableCredential?.credentialSubject?.id,
        issuerDid: response.verifiableCredential?.issuer?.id,
        ipfsCid: response.storage?.cid,
        ipfsGatewayUrl: response.storage?.gatewayUrl,
      });

      setFormData({
        studentName: "",
        studentWalletAddress: "",
        studentId: "",
        degree: "",
        year: new Date().getFullYear(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issuer-page">
      <div className="container">
        <div className="header">
          <h1>Issuer Dashboard</h1>
          <p>Issue W3C-style academic credentials with did:ethr identifiers on Sepolia.</p>
        </div>

        {issuerInfo && (
          <div className="issuer-info">
            <div className="info-card">
              <label>Issuer Address</label>
              <code>{issuerInfo.issuerAddress}</code>
            </div>
            <div className="info-card">
              <label>Balance</label>
              <span>{issuerInfo.balance}</span>
            </div>
            <div className="info-card">
              <label>Network</label>
              <span>Sepolia (Chain ID: {issuerInfo.network?.chainId})</span>
            </div>
          </div>
        )}

        <form onSubmit={handleIssueCredential} className="credential-form">
          <h2>Issue New Credential</h2>

          <div className="form-group">
            <label htmlFor="studentName">Student Name</label>
            <input
              id="studentName"
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="Enter student full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentWalletAddress">Student Wallet Address</label>
            <input
              id="studentWalletAddress"
              type="text"
              name="studentWalletAddress"
              value={formData.studentWalletAddress}
              onChange={handleChange}
              placeholder="0x..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="studentId">Student Lookup ID</label>
            <input
              id="studentId"
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Optional custom wallet lookup value"
            />
          </div>

          <div className="form-group">
            <label htmlFor="degree">Degree/Certification</label>
            <input
              id="degree"
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              placeholder="e.g., Bachelor of Science in Computer Science"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Year of Graduation</label>
            <input
              id="year"
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear() + 10}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Issuing..." : "Issue Credential"}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {result && (
          <div className="success-box">
            <h3>Credential Issued Successfully</h3>
            <div className="result-details">
              <div className="detail">
                <label>Wallet Lookup ID</label>
                <code>{result.studentId}</code>
              </div>
              <div className="detail">
                <label>Credential ID</label>
                <code>{result.credentialId}</code>
              </div>
              <div className="detail">
                <label>Subject DID</label>
                <code>{result.subjectDid}</code>
              </div>
              <div className="detail">
                <label>Issuer DID</label>
                <code>{result.issuerDid}</code>
              </div>
              <div className="detail">
                <label>Credential Hash</label>
                <code>{result.hash}</code>
              </div>
              <div className="detail">
                <label>Transaction Hash</label>
                <code>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.tx}
                  </a>
                </code>
              </div>
              <div className="detail">
                <label>IPFS CID</label>
                <code>{result.ipfsCid || "Not uploaded"}</code>
              </div>
              {result.ipfsGatewayUrl && (
                <div className="detail">
                  <label>IPFS Gateway</label>
                  <code>
                    <a href={result.ipfsGatewayUrl} target="_blank" rel="noopener noreferrer">
                      Open stored credential
                    </a>
                  </code>
                </div>
              )}
              <p className="note">
                Use the wallet lookup ID, credential ID, wallet address, or DID on the Wallet page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IssuerPage;
