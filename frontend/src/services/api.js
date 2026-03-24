/**
 * API Service
 *
 * Centralized, reusable API layer for frontend-to-backend communication.
 */

import axios from "axios";

const DEFAULT_API_URL = "http://localhost:5000/api";

const normalizeBaseUrl = (url) => (url || DEFAULT_API_URL).replace(/\/+$/, "");

const API_URL = normalizeBaseUrl(
  process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL
);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const buildApiError = (error, fallbackMessage) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage ||
    "Something went wrong while calling the API.";

  const apiError = new Error(message);
  apiError.status = error?.response?.status;
  apiError.data = error?.response?.data;
  apiError.originalError = error;

  return apiError;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(buildApiError(error))
);

const get = async (url, config = {}, fallbackMessage) => {
  try {
    const response = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    throw buildApiError(error, fallbackMessage);
  }
};

const post = async (url, data = {}, config = {}, fallbackMessage) => {
  try {
    const response = await apiClient.post(url, data, config);
    return response.data;
  } catch (error) {
    throw buildApiError(error, fallbackMessage);
  }
};

export const issuerAPI = {
  createCredential: async (studentName, degree, year) => {
    try {
      return await post(
        "/issuer/create-credential",
        { studentName, degree, year },
        {},
        "Unable to create credential."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to create credential.");
    }
  },

  issueCredential: async (studentName, degree, year, studentId) => {
    try {
      return await post(
        "/issuer/issue-credential",
        { studentName, degree, year, studentId },
        {},
        "Unable to issue credential."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to issue credential.");
    }
  },

  getInfo: async () => {
    try {
      return await get("/issuer/info", {}, "Unable to fetch issuer info.");
    } catch (error) {
      throw buildApiError(error, "Unable to fetch issuer info.");
    }
  },

  getStats: async () => {
    try {
      return await get("/issuer/stats", {}, "Unable to fetch issuer stats.");
    } catch (error) {
      throw buildApiError(error, "Unable to fetch issuer stats.");
    }
  },
};

export const walletAPI = {
  storeCredential: async (
    userId,
    credential,
    credentialHash,
    signature,
    credentialType
  ) => {
    try {
      return await post(
        "/wallet/store",
        { userId, credential, credentialHash, signature, credentialType },
        {},
        "Unable to store credential."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to store credential.");
    }
  },

  getCredentials: async (userId) => {
    try {
      return await get(
        "/wallet/credentials",
        { params: { userId } },
        "Unable to fetch wallet credentials."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to fetch wallet credentials.");
    }
  },

  getCredential: async (hash) => {
    try {
      return await get(
        `/wallet/credential/${hash}`,
        {},
        "Unable to fetch credential."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to fetch credential.");
    }
  },

  generateQR: async (credentialHash) => {
    try {
      return await post(
        "/wallet/qr",
        { credentialHash },
        {},
        "Unable to generate QR code."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to generate QR code.");
    }
  },

  downloadCredential: async (hash) => {
    try {
      return await get(
        `/wallet/download/${hash}`,
        {},
        "Unable to download credential."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to download credential.");
    }
  },

  getSummary: async (userId) => {
    try {
      return await get(
        "/wallet/summary",
        { params: { userId } },
        "Unable to fetch wallet summary."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to fetch wallet summary.");
    }
  },
};

export const verifierAPI = {
  verifyCredential: async (credential, signature, credentialHash) => {
    try {
      return await post(
        "/verify/validate-credential",
        { credential, signature, credentialHash },
        {},
        "Unable to verify credential."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to verify credential.");
    }
  },

  batchVerify: async (credentials) => {
    try {
      return await post(
        "/verify/batch",
        { credentials },
        {},
        "Unable to verify credentials."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to verify credentials.");
    }
  },

  getCredentialDetails: async (hash) => {
    try {
      return await get(
        `/verify/credential/${hash}`,
        {},
        "Unable to fetch credential details."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to fetch credential details.");
    }
  },

  verifyIssuer: async (issuerAddress, credentialHash) => {
    try {
      return await post(
        "/verify/issuer",
        { issuerAddress, credentialHash },
        {},
        "Unable to verify issuer."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to verify issuer.");
    }
  },

  getVerificationReport: async (credential, signature) => {
    try {
      return await post(
        "/verify/report",
        { credential, signature },
        {},
        "Unable to generate verification report."
      );
    } catch (error) {
      throw buildApiError(error, "Unable to generate verification report.");
    }
  },
};

export const blockchainAPI = {
  getStatus: async () => {
    try {
      return await get("/blockchain/status", {}, "Unable to fetch blockchain status.");
    } catch (error) {
      console.warn("Blockchain status unavailable:", error);
      return { success: false, blockchain: null, message: error.message };
    }
  },
};

export const healthAPI = {
  check: async () => {
    try {
      return await get("/", {}, "Unable to reach backend.");
    } catch (error) {
      return { status: "error", message: error.message };
    }
  },
};

// Backward-compatible alias in case legacy code imports issueAPI.
export const issueAPI = issuerAPI;

export { apiClient, API_URL };

const api = {
  issuerAPI,
  issueAPI,
  walletAPI,
  verifierAPI,
  blockchainAPI,
  healthAPI,
};

export default api;
