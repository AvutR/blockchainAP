class IpfsService {
  getApiUrl() {
    const rawUrl = process.env.IPFS_API_URL;

    if (!rawUrl) {
      return "https://api.pinata.cloud/pinning/pinJSONToIPFS";
    }

    return rawUrl.endsWith("/pinJSONToIPFS")
      ? rawUrl
      : `${rawUrl.replace(/\/+$/, "")}/pinning/pinJSONToIPFS`;
  }

  getGatewayBaseUrl() {
    return (process.env.IPFS_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs").replace(/\/+$/, "");
  }

  isConfigured() {
    return Boolean(process.env.IPFS_JWT);
  }

  async uploadJSON(payload, name = "ssi-verifiable-credential") {
    if (!this.isConfigured()) {
      return {
        configured: false,
        uploaded: false,
        provider: "pinata",
        cid: null,
        uri: null,
        gatewayUrl: null,
        message: "IPFS_JWT is not configured",
      };
    }

    if (typeof fetch !== "function") {
      return {
        configured: true,
        uploaded: false,
        provider: "pinata",
        cid: null,
        uri: null,
        gatewayUrl: null,
        message: "Global fetch is not available in this Node.js runtime",
      };
    }

    try {
      const response = await fetch(this.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.IPFS_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: payload,
          pinataMetadata: { name },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `IPFS upload failed with status ${response.status}`);
      }

      const result = await response.json();
      const cid = result.IpfsHash;

      return {
        configured: true,
        uploaded: true,
        provider: "pinata",
        cid,
        uri: cid ? `ipfs://${cid}` : null,
        gatewayUrl: cid ? `${this.getGatewayBaseUrl()}/${cid}` : null,
        message: "Credential uploaded to IPFS",
      };
    } catch (error) {
      return {
        configured: true,
        uploaded: false,
        provider: "pinata",
        cid: null,
        uri: null,
        gatewayUrl: null,
        message: error.message,
      };
    }
  }
}

module.exports = new IpfsService();
