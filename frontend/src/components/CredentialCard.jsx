/**
 * Credential Card Component
 *
 * Displays an individual credential summary in the wallet.
 */

import React from "react";
import "./CredentialCard.css";

function CredentialCard({ credential, onDownload, onQR }) {
  return (
    <div className="credential-card">
      <div className="card-header">
        <h3>{credential.degree}</h3>
        <span className="badge">{credential.credentialType}</span>
      </div>

      <div className="card-body">
        <div className="field">
          <label>Student Name</label>
          <p>{credential.studentName}</p>
        </div>

        <div className="field">
          <label>Subject DID</label>
          <code className="hash">{credential.subjectDid || "Not available"}</code>
        </div>

        <div className="field">
          <label>Year</label>
          <p>{credential.year}</p>
        </div>

        <div className="field">
          <label>Issued</label>
          <p>{new Date(credential.issuedAt).toLocaleDateString()}</p>
        </div>

        <div className="field">
          <label>Hash</label>
          <code className="hash">{credential.credentialHash}</code>
        </div>

        {credential.ipfsCid && (
          <div className="field">
            <label>IPFS CID</label>
            <code className="hash">{credential.ipfsCid}</code>
          </div>
        )}

        {credential.blockchainTx && (
          <div className="field">
            <label>On-Chain</label>
            <a
              href={`https://sepolia.etherscan.io/tx/${credential.blockchainTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              View Transaction
            </a>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button
          onClick={() => onDownload(credential.credentialHash)}
          className="btn-download"
          title="Download as JSON"
        >
          Download
        </button>
        <button
          onClick={() => onQR(credential)}
          className="btn-qr"
          title="Generate QR code"
        >
          QR Code
        </button>
      </div>
    </div>
  );
}

export default CredentialCard;
