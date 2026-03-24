/**
 * Test Suite for CredentialRegistry Smart Contract
 * 
 * Run with:
 *   npx hardhat test
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  
  let credentialRegistry;
  let owner, issuer, student, verifier;
  
  const credentialType = "Bachelor of Science";
  
  beforeEach(async function () {
    // Get signers
    [owner, issuer, student, verifier] = await ethers.getSigners();

    // Deploy contract
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy();
    await credentialRegistry.deployed();

    // Register issuer
    await credentialRegistry.registerIssuer(issuer.address, "University of Test");
  });

  describe("Deployment", function () {
    it("Should set the correct admin", async function () {
      expect(await credentialRegistry.admin()).to.equal(owner.address);
    });

    it("Should initialize with zero total credentials", async function () {
      expect(await credentialRegistry.totalCredentials()).to.equal(0);
    });
  });

  describe("Issuer Management", function () {
    it("Should register an issuer", async function () {
      const issuerInfo = await credentialRegistry.getIssuerInfo(issuer.address);
      expect(issuerInfo.issuerAddress).to.equal(issuer.address);
      expect(issuerInfo.isApproved).to.equal(true);
    });

    it("Should approve/disapprove issuer", async function () {
      await credentialRegistry.setIssuerApproval(issuer.address, false);
      let issuerInfo = await credentialRegistry.getIssuerInfo(issuer.address);
      expect(issuerInfo.isApproved).to.equal(false);

      await credentialRegistry.setIssuerApproval(issuer.address, true);
      issuerInfo = await credentialRegistry.getIssuerInfo(issuer.address);
      expect(issuerInfo.isApproved).to.equal(true);
    });

    it("Should check if address is approved issuer", async function () {
      expect(await credentialRegistry.isApprovedIssuer(issuer.address)).to.equal(true);
      expect(await credentialRegistry.isApprovedIssuer(student.address)).to.equal(false);
    });

    it("Should get list of approved issuers", async function () {
      const approvedIssuers = await credentialRegistry.getApprovedIssuers();
      expect(approvedIssuers).to.include(issuer.address);
    });
  });

  describe("Credential Registration", function () {
    it("Should register a credential", async function () {
      const credentialData = "John Doe - Bachelor of Science - 2024";
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialData));

      await credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType);

      expect(await credentialRegistry.totalCredentials()).to.equal(1);
    });

    it("Should not allow non-approved issuer to register", async function () {
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));

      await expect(
        credentialRegistry.connect(student).registerCredential(credentialHash, credentialType)
      ).to.be.revertedWith("Only approved issuers can register credentials");
    });

    it("Should not allow duplicate credential registration", async function () {
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));

      await credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType);

      await expect(
        credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType)
      ).to.be.revertedWith("Credential already registered");
    });

    it("Should not allow zero hash registration", async function () {
      const zeroHash = ethers.utils.toUtf8Bytes("\0");

      await expect(
        credentialRegistry.connect(issuer).registerCredential(zeroHash, credentialType)
      ).to.be.revertedWith("Invalid credential hash");
    });

    it("Should not allow empty credential type", async function () {
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));

      await expect(
        credentialRegistry.connect(issuer).registerCredential(credentialHash, "")
      ).to.be.revertedWith("Credential type cannot be empty");
    });
  });

  describe("Credential Verification", function () {
    let credentialHash;

    beforeEach(async function () {
      const credentialData = "Jane Doe - Master of Arts - 2024";
      credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialData));
      await credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType);
    });

    it("Should verify a valid credential", async function () {
      const isValid = await credentialRegistry.verifyCredential(credentialHash);
      expect(isValid).to.equal(true);
    });

    it("Should get issuer for a credential", async function () {
      const credentialIssuer = await credentialRegistry.getIssuer(credentialHash);
      expect(credentialIssuer).to.equal(issuer.address);
    });

    it("Should get full credential data", async function () {
      const credential = await credentialRegistry.getCredential(credentialHash);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.revoked).to.equal(false);
      expect(credential.credentialType).to.equal(credentialType);
    });

    it("Should check credential existence", async function () {
      expect(await credentialRegistry.credentialExists(credentialHash)).to.equal(true);

      const fakeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));
      expect(await credentialRegistry.credentialExists(fakeHash)).to.equal(false);
    });

    it("Should revert when querying non-existent credential", async function () {
      const fakeHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("fake"));

      await expect(
        credentialRegistry.getIssuer(fakeHash)
      ).to.be.revertedWith("Credential does not exist");
    });
  });

  describe("Credential Revocation", function () {
    let credentialHash;

    beforeEach(async function () {
      const credentialData = "Bob Smith - Diploma - 2024";
      credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(credentialData));
      await credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType);
    });

    it("Should revoke a credential by issuer", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialHash);

      const isValid = await credentialRegistry.verifyCredential(credentialHash);
      expect(isValid).to.equal(false);
    });

    it("Should revoke a credential by admin", async function () {
      await credentialRegistry.connect(owner).revokeCredential(credentialHash);

      const isValid = await credentialRegistry.verifyCredential(credentialHash);
      expect(isValid).to.equal(false);
    });

    it("Should not allow non-issuer to revoke", async function () {
      await expect(
        credentialRegistry.connect(student).revokeCredential(credentialHash)
      ).to.be.revertedWith("Only issuer or admin can revoke");
    });

    it("Should not allow double revocation", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialHash);

      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialHash)
      ).to.be.revertedWith("Credential already revoked");
    });

    it("Should restore a revoked credential", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialHash);
      let isValid = await credentialRegistry.verifyCredential(credentialHash);
      expect(isValid).to.equal(false);

      await credentialRegistry.connect(issuer).restoreCredential(credentialHash);
      isValid = await credentialRegistry.verifyCredential(credentialHash);
      expect(isValid).to.equal(true);
    });

    it("Should not allow restore of non-revoked credential", async function () {
      await expect(
        credentialRegistry.connect(issuer).restoreCredential(credentialHash)
      ).to.be.revertedWith("Credential is not revoked");
    });
  });

  describe("Admin Functions", function () {
    it("Should transfer admin rights", async function () {
      await credentialRegistry.transferAdmin(issuer.address);
      expect(await credentialRegistry.admin()).to.equal(issuer.address);
    });

    it("Should not allow non-admin to transfer admin", async function () {
      await expect(
        credentialRegistry.connect(student).transferAdmin(issuer.address)
      ).to.be.revertedWith("Only admin can call this function");
    });

    it("Should get contract statistics", async function () {
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test"));
      await credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType);

      const stats = await credentialRegistry.getStats();
      expect(stats).to.equal(1);
    });
  });

  describe("Events", function () {
    it("Should emit CredentialRegistered event", async function () {
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-event"));

      await expect(
        credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType)
      ).to.emit(credentialRegistry, "CredentialRegistered")
        .withArgs(credentialHash, issuer.address, expect.any(Object), credentialType);
    });

    it("Should emit CredentialRevoked event", async function () {
      const credentialHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-revoke"));
      await credentialRegistry.connect(issuer).registerCredential(credentialHash, credentialType);

      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialHash)
      ).to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(credentialHash, issuer.address, expect.any(Object));
    });
  });
});
