/**
 * Issuer Page
 * 
 * University/Issuer dashboard for creating and issuing credentials
 */

import React, { useState, useEffect } from "react";
import { issuerAPI, blockchainAPI } from "../services/api";
import "./IssuerPage.css";

function IssuerPage() {
  const [formData, setFormData] = useState({
    studentName: "",
    degree: "",
    year: new Date().getFullYear()
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [issuerInfo, setIssuerInfo] = useState(null);

  // Fetch issuer info
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

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "year" ? parseInt(value) : value
    });
  };

  // Issue credential
  const handleIssueCredential = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await issuerAPI.issueCredential(
        formData.studentName,
        formData.degree,
        formData.year,
        formData.studentName
      );

      setResult({
        success: true,
        credentialId: response.credentialId,
        hash: response.credentialHash,
        tx: response.blockchainTx
      });

      // Reset form
      setFormData({
        studentName: "",
        degree: "",
        year: new Date().getFullYear()
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="issuer-page">
      <div className="container">
        <div className="header">
          <h1>🏫 Issuer Dashboard</h1>
          <p>Create and issue academic credentials on Sepolia blockchain</p>
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
            {loading ? "⏳ Issuing..." : "📝 Issue Credential"}
          </button>
        </form>

        {error && <div className="error-box">{error}</div>}

        {result && (
          <div className="success-box">
            <h3>✅ Credential Issued Successfully!</h3>
            <div className="result-details">
              <div className="detail">
                <label>Credential ID</label>
                <code>{result.credentialId}</code>
              </div>
              <div className="detail">
                <label>Credential Hash</label>
                <code>{result.hash.substring(0, 40)}...</code>
              </div>
              <div className="detail">
                <label>Transaction Hash</label>
                <code>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.tx.substring(0, 20)}...
                  </a>
                </code>
              </div>
              <p className="note">
                Student can now download this credential in their wallet. Share the credential ID with them.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IssuerPage;
