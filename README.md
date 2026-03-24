# SSI Sepolia Student Credential Demo

This project now issues W3C-style academic credentials with:

- `did:ethr` issuer and subject identifiers
- W3C Verifiable Credential structure
- `proof`-based signing
- optional IPFS JSON storage with saved CID
- on-chain hash anchoring on Sepolia

The smart contract still stores only the credential hash and metadata on-chain. The full credential JSON stays off-chain and is kept in backend memory, with optional IPFS upload.

## What Is Implemented

- Issuer flow now requires a student wallet address and turns it into `did:ethr:0x...`
- Credentials are built as W3C-style Verifiable Credentials
- Credentials are hashed from the unsigned VC payload using deterministic key ordering
- The backend signs the VC hash and stores the signature in `proof.jws`
- The VC JSON is optionally uploaded to IPFS when `IPFS_JWT` is configured
- The wallet downloads a VC-shaped JSON file instead of the old custom export
- The verifier accepts both the new VC JSON and the old legacy export format

## Current Architecture

### Frontend

- `/issuer` issues a credential
- `/wallet` looks up credentials by student ID, DID, wallet address, credential ID, or hash
- `/verify` uploads a credential JSON file and verifies DID, proof, and blockchain registration

### Backend

- `backend/src/services/credentialService.js` builds the VC, signs it, uploads it to IPFS, and stores it in memory
- `backend/src/services/cryptoService.js` canonicalizes JSON, hashes payloads, signs hashes, and verifies signatures
- `backend/src/services/didService.js` converts Ethereum addresses to and from `did:ethr`
- `backend/src/services/ipfsService.js` uploads JSON to Pinata-compatible IPFS endpoints
- `backend/src/services/blockchainService.js` registers and verifies the credential hash on Sepolia

### Smart Contract

`contracts/CredentialRegistry.sol` is unchanged in structure and currently stores:

- issuer address
- issued timestamp
- revocation status
- credential type

It does not yet store the IPFS CID on-chain.

## Current VC Shape

Issued credentials now look like this:

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "id": "urn:uuid:...",
  "type": [
    "VerifiableCredential",
    "UniversityDegreeCredential"
  ],
  "issuer": {
    "id": "did:ethr:0xIssuerWallet",
    "name": "SSI Sepolia Issuer"
  },
  "issuanceDate": "2026-03-24T12:00:00.000Z",
  "credentialSubject": {
    "id": "did:ethr:0xStudentWallet",
    "walletAddress": "0xStudentWallet",
    "studentId": "0xStudentWallet",
    "studentName": "Alice Johnson",
    "degree": "Bachelor of Science in Computer Science",
    "year": 2026
  },
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "created": "2026-03-24T12:00:00.000Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:ethr:0xIssuerWallet#controller",
    "jws": "0x...",
    "blockchainHash": "0x...",
    "blockchainTx": "0x...",
    "blockNumber": 1234567,
    "storage": {
      "type": "ipfs",
      "configured": true,
      "uploaded": true,
      "provider": "pinata",
      "cid": "bafy...",
      "uri": "ipfs://bafy...",
      "gatewayUrl": "https://gateway.pinata.cloud/ipfs/bafy...",
      "message": "Credential uploaded to IPFS"
    }
  }
}
```

## End-To-End Flow

### 1. Issue

The issuer page sends:

```http
POST /api/issuer/issue-credential
```

Request body:

```json
{
  "studentName": "Alice Johnson",
  "studentWalletAddress": "0xStudentWallet",
  "studentId": "alice-wallet",
  "degree": "Bachelor of Science in Computer Science",
  "year": 2026
}
```

The backend then:

1. validates the wallet address
2. converts issuer and subject addresses into `did:ethr`
3. builds the unsigned VC payload
4. hashes the VC payload without `proof`
5. signs the hash with the backend private key
6. creates the `proof` object
7. optionally uploads the VC JSON to IPFS
8. registers the hash on Sepolia
9. stores the credential in backend memory

### 2. Wallet Lookup

The wallet page calls:

```http
GET /api/wallet/credentials?userId=<lookup>
```

Lookup can be:

- student ID
- subject DID
- wallet address
- credential ID
- credential hash

### 3. Verify

The verifier page uploads the downloaded VC JSON and sends it to:

```http
POST /api/verify/validate-credential
```

The verifier backend:

1. parses either a new VC payload or the legacy export
2. recomputes the hash from the unsigned credential payload
3. resolves the issuer address from the issuer DID
4. verifies `proof.jws`
5. checks the credential hash on-chain

If blockchain access is unavailable, the verifier still reports proof validity and marks blockchain status as unavailable.

## Current API Summary

Base URL:

```text
http://localhost:5000/api
```

### Issuer

- `POST /issuer/create-credential`
- `POST /issuer/issue-credential`
- `GET /issuer/info`
- `GET /issuer/stats`

### Wallet

- `POST /wallet/store`
- `GET /wallet/credentials`
- `GET /wallet/credential/:hash`
- `POST /wallet/qr`
- `GET /wallet/download/:hash`
- `GET /wallet/summary`

### Verifier

- `POST /verify/validate-credential`
- `POST /verify/batch`
- `GET /verify/credential/:hash`
- `POST /verify/issuer`
- `POST /verify/report`

### Utility

- `GET /`
- `GET /health`
- `GET /api/blockchain/status`

## Setup

### Prerequisites

- Node.js 16 or newer
- npm
- Sepolia RPC URL
- funded Sepolia private key for the backend signer
- optional Pinata JWT for IPFS upload

### Install

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Root `.env`

Used by Hardhat scripts and tests:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
CONTRACT_ADDRESS=0xyour_contract_address
```

### `backend/.env`

Used by the backend server:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
CONTRACT_ADDRESS=0xyour_contract_address
PORT=5000
FRONTEND_URL=http://localhost:3000
ISSUER_NAME=SSI Sepolia Issuer
IPFS_API_URL=https://api.pinata.cloud/pinning/pinJSONToIPFS
IPFS_JWT=your_pinata_jwt_token
IPFS_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

### `frontend/.env`

Optional:

```env
REACT_APP_BACKEND_URL=http://localhost:5000/api
```

## Run

Start backend:

```bash
npm run backend
```

Start frontend in another terminal:

```bash
npm run frontend
```

## Current Sepolia Deployment

- Contract: `CredentialRegistry`
- Contract address: `0xaC4a4bbEeD7CFb4724C58885103D9f8fEA36571B`
- Etherscan: `https://sepolia.etherscan.io/address/0xaC4a4bbEeD7CFb4724C58885103D9f8fEA36571B`

## Manual Demo

### Issue

1. Open `http://localhost:3000/issuer`
2. Enter student name, student wallet address, optional lookup ID, degree, and year
3. Submit
4. Copy the lookup ID or DID from the success panel

### Wallet

1. Open `http://localhost:3000/wallet`
2. Search by lookup ID, DID, wallet address, credential ID, or hash
3. Download the VC JSON file
4. Optionally open the IPFS gateway link if a CID was created

### Verify

1. Open `http://localhost:3000/verify`
2. Upload the downloaded VC JSON
3. Review proof and blockchain verification results

## Current Limitations

- Wallet storage is still in-memory only
- The backend signs credentials directly; MetaMask is not part of the issuer flow
- The contract stores hash metadata only, not the IPFS CID
- Revocation exists in the contract but is not exposed in the frontend
- There is still no database or authentication layer

## Contract Test Status

`npm run test-contract` still has failing tests in the current repo state. The main issues are in the test suite itself:

- missing Hardhat Chai matcher setup for `revertedWith` and `emit`
- direct `BigNumber` to number comparisons
- one test calling `credentialExists` like a public function even though it is only a modifier

## Security Note

Use only a testnet wallet in `.env` files. Do not commit real private keys.
