/**
 * Upload Box Component
 * 
 * Drag & drop file upload for credentials
 */

import React, { useRef } from "react";
import "./UploadBox.css";

function UploadBox({ onFileUpload }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = React.useState(false);

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragging(false);
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".json")) {
        onFileUpload(file);
      } else {
        alert("Please upload a JSON file");
      }
    }
  };

  // Handle file input
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div
      className={`upload-box ${dragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-content">
        <div className="upload-icon">📄</div>
        <h3>Drop credential file here</h3>
        <p>or click to browse</p>
        <p className="format">.json format</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        className="file-input"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="browse-btn"
      >
        Browse Files
      </button>
    </div>
  );
}

export default UploadBox;
