/**
 * API Service
 * 
 * Centralized API calls to backend
 */

import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// ============================================================================
// ISSUER ENDPOINTS
// ============================================================================

export const issuerAPI = {
  /**
   * Create credential
   */
  createCredential: async (studentName, degree, year) => {
    const response = await apiClient.post("/issuer/create-credential", {
      studentName,
      degree,
      year
    });
    return response.data;
  },

  /**
   * Issue credential (create + register on blockchain)
   */
  issueCredential: async (studentName, degree, year, studentId) => {
    const response = await apiClient.post("/issuer/issue-credential", {
      studentName,
      degree,
      year,
      studentId
    });
    return response.data;
  },

  /**
   * Get issuer info
   */
  getInfo: async () => {
    const response = await apiClient.get("/issuer/info");
    return response.data;
  },

  /**
   * Get statistics
   */
  getStats: async () => {
    const response = await apiClient.get("/issuer/stats");
    return response.data;
  }
};

// ============================================================================
// WALLET ENDPOINTS
// ============================================================================

export const walletAPI = {
  /**
   * Store credential
   */
  storeCredential: async (userId, credential, credentialHash, signature, credentialType) => {
    const response = await apiClient.post("/wallet/store", {
      userId,
      credential,
      credentialHash,
      signature,
      credentialType
    });
    return response.data;
  },

  /**
   * Get credentials for student
   */
  getCredentials: async (userId) => {
    const response = await apiClient.get("/wallet/credentials", {
      params: { userId }
    });
    return response.data;
  },

  /**
   * Get specific credential
   */
  getCredential: async (hash) => {
    const response = await apiClient.get(`/wallet/credential/${hash}`);
    return response.data;
  },

  /**
   * Generate QR code
   */
  generateQR: async (credentialHash) => {
    const response = await apiClient.post("/wallet/qr", {
      credentialHash
    });
    return response.data;
  },

  /**
   * Download credential
   */
  downloadCredential: async (hash) => {
    const response = await apiClient.get(`/wallet/download/${hash}`);
    return response.data;
  },

  /**
   * Get wallet summary
   */
  getSummary: async (userId) => {
    const response = await apiClient.get("/wallet/summary", {
      params: { userId }
    });
    return response.data;
  }
};

// ============================================================================
// VERIFIER ENDPOINTS
// ============================================================================

export const verifierAPI = {
  /**
   * Verify credential
   */
  verifyCredential: async (credential, signature, credentialHash) => {
    const response = await apiClient.post("/verify/validate-credential", {
      credential,
      signature,
      credentialHash
    });
    return response.data;
  },

  /**
   * Batch verify credentials
   */
  batchVerify: async (credentials) => {
    const response = await apiClient.post("/verify/batch", {
      credentials
    });
    return response.data;
  },

  /**
   * Get credential details
   */
  getCredentialDetails: async (hash) => {
    const response = await apiClient.get(`/verify/credential/${hash}`);
    return response.data;
  },

  /**
   * Verify issuer
   */
  verifyIssuer: async (issuerAddress, credentialHash) => {
    const response = await apiClient.post("/verify/issuer", {
      issuerAddress,
      credentialHash
    });
    return response.data;
  },

  /**
   * Get verification report
   */
  getVerificationReport: async (credential, signature) => {
    const response = await apiClient.post("/verify/report", {
      credential,
      signature
    });
    return response.data;
  }
};

// ============================================================================
// BLOCKCHAIN ENDPOINTS
// ============================================================================

export const blockchainAPI = {
  /**
   * Get blockchain status
   */
  getStatus: async () => {
    try {
      const response = await apiClient.get("/blockchain/status");
      return response.data;
    } catch (error) {
      console.warn("Blockchain status unavailable:", error);
      return { success: false, blockchain: null };
    }
  }
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthAPI = {
  /**
   * Check backend health
   */
  check: async () => {
    try {
      const response = await apiClient.get("/");
      return response.data;
    } catch (error) {
      return { status: "error" };
    }
  }
};

export default {
  issueAPI,
  walletAPI,
  verifierAPI,
  blockchainAPI,
  healthAPI
};
