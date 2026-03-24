/**
 * Credential Model
 * 
 * Defines the structure and validation for credentials
 * (Currently uses in-memory storage; can be adapted for MongoDB)
 */

class CredentialModel {
  
  /**
   * Validate credential data
   * 
   * @param {Object} credential - Credential to validate
   * @returns {Object} Validation result
   */
  static validate(credential) {
    const errors = [];

    if (!credential.studentName || credential.studentName.trim() === "") {
      errors.push("studentName is required");
    }

    if (!credential.degree || credential.degree.trim() === "") {
      errors.push("degree is required");
    }

    if (!credential.year || isNaN(credential.year)) {
      errors.push("year is required and must be a number");
    }

    if (credential.year < 1900 || credential.year > new Date().getFullYear() + 10) {
      errors.push("year must be realistic");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize credential data
   * 
   * @param {Object} credential - Credential to sanitize
   * @returns {Object} Sanitized credential
   */
  static sanitize(credential) {
    return {
      studentName: String(credential.studentName).trim(),
      degree: String(credential.degree).trim(),
      year: parseInt(credential.year),
      issuerAddress: credential.issuerAddress ? String(credential.issuerAddress).toLowerCase() : undefined
    };
  }

  /**
   * Format credential for response
   * 
   * @param {Object} credential - Credential to format
   * @returns {Object} Formatted credential
   */
  static format(credential) {
    return {
      id: credential.id,
      studentName: credential.studentName,
      degree: credential.degree,
      year: credential.year,
      issuedAt: credential.issuedAt,
      credentialType: credential.credentialType || credential.degree,
      blockchainTx: credential.blockchainTx,
      blockNumber: credential.blockNumber
    };
  }

  /**
   * Create empty credential template
   * 
   * @returns {Object} Empty credential
   */
  static createTemplate() {
    return {
      studentName: "",
      degree: "",
      year: new Date().getFullYear(),
      issuedAt: new Date().toISOString()
    };
  }
}

module.exports = CredentialModel;
