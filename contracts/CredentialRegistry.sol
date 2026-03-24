// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredentialRegistry
 * @dev Decentralized Self-Sovereign Identity System for Student Credentials
 * 
 * This contract manages the registration and verification of student credentials
 * on the Ethereum blockchain. It stores credential hashes and issuer information
 * to enable decentralized credential verification without a central authority.
 * 
 * Features:
 * - Register credential hashes on-chain
 * - Verify credential existence and integrity
 * - Track issuer information
 * - Emit events for off-chain indexing
 * - Support for credential revocation (optional)
 */

contract CredentialRegistry {
    
    // ============================================================================
    // DATA STRUCTURES
    // ============================================================================
    
    /// @dev Credential structure to store metadata
    struct Credential {
        address issuer;              // Address of the issuer
        uint256 issuedAt;            // Timestamp of issuance
        bool revoked;                // Revocation status
        string credentialType;       // Type of credential (e.g., "Degree", "Certificate")
    }
    
    /// @dev Event Credential - issued, verified, and revoked event emissions
    struct Issuer {
        address issuerAddress;
        string issuerName;
        bool isApproved;
        uint256 registeredAt;
    }
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    /// @dev Mapping of credential hash to Credential data
    mapping(bytes32 => Credential) public credentials;
    
    /// @dev Mapping of issuer addresses to Issuer data
    mapping(address => Issuer) public issuers;
    
    /// @dev Array of approved issuer addresses
    address[] public approvedIssuers;
    
    /// @dev Contract owner/admin
    address public admin;
    
    /// @dev Total credentials registered
    uint256 public totalCredentials;
    
    // ============================================================================
    // EVENTS
    // ============================================================================
    
    /// @dev Emitted when a credential is registered
    event CredentialRegistered(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 timestamp,
        string credentialType
    );
    
    /// @dev Emitted when a credential is verified
    event CredentialVerified(
        bytes32 indexed credentialHash,
        bool isValid,
        uint256 verifiedAt
    );
    
    /// @dev Emitted when a credential is revoked
    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed issuer,
        uint256 revokedAt
    );
    
    /// @dev Emitted when an issuer is registered
    event IssuerRegistered(
        address indexed issuerAddress,
        string issuerName,
        uint256 registeredAt
    );
    
    /// @dev Emitted when issuer is approved/disapproved
    event IssuerApprovalChanged(
        address indexed issuerAddress,
        bool isApproved
    );
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    /// @dev Ensures only admin can call the function
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    /// @dev Ensures only approved issuers can register credentials
    modifier onlyApprovedIssuer() {
        require(
            issuers[msg.sender].isApproved,
            "Only approved issuers can register credentials"
        );
        _;
    }
    
    /// @dev Ensures credential exists
    modifier credentialExists(bytes32 _hash) {
        require(
            credentials[_hash].issuer != address(0),
            "Credential does not exist"
        );
        _;
    }
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    /// @dev Initialize contract with admin address
    constructor() {
        admin = msg.sender;
    }
    
    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    /**
     * @dev Register an issuer (university/organization)
     * @param _issuerAddress Address of the issuer
     * @param _issuerName Name of the issuer organization
     */
    function registerIssuer(
        address _issuerAddress,
        string memory _issuerName
    ) external onlyAdmin {
        require(_issuerAddress != address(0), "Invalid issuer address");
        require(bytes(_issuerName).length > 0, "Issuer name cannot be empty");
        
        issuers[_issuerAddress] = Issuer({
            issuerAddress: _issuerAddress,
            issuerName: _issuerName,
            isApproved: true,
            registeredAt: block.timestamp
        });
        
        approvedIssuers.push(_issuerAddress);
        
        emit IssuerRegistered(_issuerAddress, _issuerName, block.timestamp);
        emit IssuerApprovalChanged(_issuerAddress, true);
    }
    
    /**
     * @dev Approve or disapprove an issuer
     * @param _issuerAddress Address of the issuer
     * @param _approved Approval status
     */
    function setIssuerApproval(
        address _issuerAddress,
        bool _approved
    ) external onlyAdmin {
        require(
            issuers[_issuerAddress].issuerAddress != address(0),
            "Issuer not registered"
        );
        
        issuers[_issuerAddress].isApproved = _approved;
        emit IssuerApprovalChanged(_issuerAddress, _approved);
    }
    
    // ============================================================================
    // CREDENTIAL REGISTRATION
    // ============================================================================
    
    /**
     * @dev Register a credential hash on-chain
     * @param _credentialHash Keccak256 hash of the credential data
     * @param _credentialType Type of credential (e.g., "Degree", "Certificate")
     * 
     * Emits: CredentialRegistered event
     */
    function registerCredential(
        bytes32 _credentialHash,
        string memory _credentialType
    ) external onlyApprovedIssuer {
        require(
            _credentialHash != bytes32(0),
            "Invalid credential hash"
        );
        require(
            credentials[_credentialHash].issuer == address(0),
            "Credential already registered"
        );
        require(
            bytes(_credentialType).length > 0,
            "Credential type cannot be empty"
        );
        
        credentials[_credentialHash] = Credential({
            issuer: msg.sender,
            issuedAt: block.timestamp,
            revoked: false,
            credentialType: _credentialType
        });
        
        totalCredentials++;
        
        emit CredentialRegistered(
            _credentialHash,
            msg.sender,
            block.timestamp,
            _credentialType
        );
    }
    
    // ============================================================================
    // CREDENTIAL VERIFICATION
    // ============================================================================
    
    /**
     * @dev Verify if a credential is valid (exists and not revoked)
     * @param _credentialHash Hash of the credential to verify
     * @return isValid True if credential exists and is not revoked
     */
    function verifyCredential(bytes32 _credentialHash)
        external
        view
        credentialExists(_credentialHash)
        returns (bool isValid)
    {
        Credential memory cred = credentials[_credentialHash];
        isValid = !cred.revoked;
    }
    
    /**
     * @dev Get issuer address for a credential
     * @param _credentialHash Hash of the credential
     * @return issuerAddress The issuer's address
     */
    function getIssuer(bytes32 _credentialHash)
        external
        view
        credentialExists(_credentialHash)
        returns (address issuerAddress)
    {
        issuerAddress = credentials[_credentialHash].issuer;
    }
    
    /**
     * @dev Get full credential data
     * @param _credentialHash Hash of the credential
     * @return credential The full credential data
     */
    function getCredential(bytes32 _credentialHash)
        external
        view
        credentialExists(_credentialHash)
        returns (Credential memory credential)
    {
        credential = credentials[_credentialHash];
    }
    
    /**
     * @dev Check if credential exists
     * @param _credentialHash Hash of the credential
     * @return exists True if credential exists
     */
    function credentialExists(bytes32 _credentialHash)
        external
        view
        returns (bool exists)
    {
        exists = credentials[_credentialHash].issuer != address(0);
    }
    
    // ============================================================================
    // CREDENTIAL REVOCATION
    // ============================================================================
    
    /**
     * @dev Revoke a credential (only issuer or admin can revoke)
     * @param _credentialHash Hash of the credential to revoke
     * 
     * Emits: CredentialRevoked event
     */
    function revokeCredential(bytes32 _credentialHash)
        external
        credentialExists(_credentialHash)
    {
        Credential storage cred = credentials[_credentialHash];
        require(
            msg.sender == cred.issuer || msg.sender == admin,
            "Only issuer or admin can revoke"
        );
        require(!cred.revoked, "Credential already revoked");
        
        cred.revoked = true;
        
        emit CredentialRevoked(_credentialHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Restore a revoked credential (only issuer or admin)
     * @param _credentialHash Hash of the credential to restore
     */
    function restoreCredential(bytes32 _credentialHash)
        external
        credentialExists(_credentialHash)
    {
        Credential storage cred = credentials[_credentialHash];
        require(
            msg.sender == cred.issuer || msg.sender == admin,
            "Only issuer or admin can restore"
        );
        require(cred.revoked, "Credential is not revoked");
        
        cred.revoked = false;
    }
    
    // ============================================================================
    // ISSUER QUERIES
    // ============================================================================
    
    /**
     * @dev Get issuer information
     * @param _issuerAddress Address of the issuer
     * @return issuer The issuer data
     */
    function getIssuerInfo(address _issuerAddress)
        external
        view
        returns (Issuer memory issuer)
    {
        issuer = issuers[_issuerAddress];
    }
    
    /**
     * @dev Get all approved issuers
     * @return approvedIssuersList Array of approved issuer addresses
     */
    function getApprovedIssuers()
        external
        view
        returns (address[] memory approvedIssuersList)
    {
        approvedIssuersList = approvedIssuers;
    }
    
    /**
     * @dev Check if address is an approved issuer
     * @param _issuerAddress Address to check
     * @return isApproved True if address is an approved issuer
     */
    function isApprovedIssuer(address _issuerAddress)
        external
        view
        returns (bool isApproved)
    {
        isApproved = issuers[_issuerAddress].isApproved;
    }
    
    // ============================================================================
    // ADMIN UTILITIES
    // ============================================================================
    
    /**
     * @dev Transfer admin rights
     * @param _newAdmin Address of new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid new admin address");
        admin = _newAdmin;
    }
    
    /**
     * @dev Get contract statistics
     * @return stats A tuple containing totalCredentials, totalIssuers
     */
    function getStats()
        external
        view
        returns (uint256 stats)
    {
        return totalCredentials;
    }
}
