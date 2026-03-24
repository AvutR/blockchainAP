const ethers = require("ethers");

class DidService {
  static toDid(address) {
    if (!ethers.utils.isAddress(address)) {
      throw new Error("A valid Ethereum address is required to create a did:ethr identifier");
    }

    return `did:ethr:${ethers.utils.getAddress(address)}`;
  }

  static fromDid(did) {
    if (typeof did !== "string" || !did.startsWith("did:ethr:")) {
      throw new Error("Invalid did:ethr identifier");
    }

    const address = did.slice("did:ethr:".length);

    if (!ethers.utils.isAddress(address)) {
      throw new Error("DID does not contain a valid Ethereum address");
    }

    return ethers.utils.getAddress(address);
  }

  static isDid(value) {
    try {
      this.fromDid(value);
      return true;
    } catch {
      return false;
    }
  }

  static toVerificationMethod(did) {
    return `${did}#controller`;
  }
}

module.exports = DidService;
