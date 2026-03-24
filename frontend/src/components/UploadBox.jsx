import React, { useRef, useState } from "react";
import "./UploadBox.css";

function UploadBox({ onFileUpload }) {
  const fileInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

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
        alert("Please upload a .json credential file");
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

  // Trigger file selection on click
  const handleBoxClick = () => {
    if (!dragging && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`upload-box ${dragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBoxClick}
    >
      <div className="upload-content">
        <div className="upload-icon">📄</div>
        <h3>Drag & Drop Credential File</h3>
        <p>or click anywhere in the box to browse</p>
        <p className="format">.json standard credential</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInputChange}
        className="file-input"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="btn browse-btn"
      >
        <span>📂</span> Browse Files
      </button>
    </div>
  );
}

export default UploadBox;
