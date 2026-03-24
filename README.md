# SSI Sepolia Student Credential Demo

This repository is a working demo for issuing, storing, and verifying academic credentials with a Node.js backend, a React frontend, and a Solidity contract on Ethereum Sepolia.

The README below describes the code as it works today, not the original template plan.

## What Is Actually Working

- The backend creates a credential object, hashes it with `keccak256(JSON.stringify(...))`, signs the hash with the issuer private key from `backend/.env`, and registers the hash on-chain.
- The smart contract stores only credential metadata on-chain: issuer address, issue timestamp, revocation flag, and credential type.
- The backend stores full credential payloads in memory using JavaScript `Map` objects.
- The frontend has three working screens:
  - `/issuer` to issue a credential
  - `/wallet` to look up credentials by student ID, credential ID, or credential hash
  - `/verify` to upload a downloaded JSON credential and validate it

## Important Current Limitations

- Wallet storage is in-memory only. If the backend restarts, issued credentials disappear from the wallet API until they are re-issued.
- The issuer flow does not use MetaMask. Transactions are sent by the backend signer from `backend/.env`.
- The wallet page stores only the last lookup value in browser `localStorage`, not the credential data itself.
- The contract supports revocation, but the current frontend does not expose revoke or restore actions.
- Contract tests are included, but they are not all passing in the current repo state.

## Current Sepolia Deployment

- Network: Sepolia
- Contract: `CredentialRegistry`
- Contract address: `0xaC4a4bbEeD7CFb4724C58885103D9f8fEA36571B`
- Deployer address: `0xF7371242c9dCFcc7C1CA8AcC1B067e455D67407C`
- Deployment record: `contracts/deployments/sepolia.json`
- Etherscan: `https://sepolia.etherscan.io/address/0xaC4a4bbEeD7CFb4724C58885103D9f8fEA36571B`

## Architecture

### Backend

The backend lives in `backend/src` and is the center of the app:

- `app.js` exposes REST endpoints and a blockchain status endpoint
- `services/cryptoService.js` hashes and signs credentials
- `services/blockchainService.js` talks to the deployed smart contract with `ethers.js`
- `services/credentialService.js` coordinates issuance and keeps in-memory wallet data

### Smart Contract

`contracts/CredentialRegistry.sol` supports:

- admin-managed issuer registration
- approved issuer checks
- credential registration
- credential verification
- credential revocation and restore
- issuer info queries

### Frontend

The React app lives in `frontend/src`:

- `pages/IssuerPage.jsx` issues credentials
- `pages/WalletPage.jsx` loads credentials from the backend and supports JSON download and QR code generation
- `pages/VerifierPage.jsx` uploads a credential JSON file and verifies it against signature and blockchain data

## Exact Runtime Flow

### 1. Issuing a Credential

The issuer page calls:

```http
POST /api/issuer/issue-credential
```

Request body:

```json
{
  "studentName": "Alice Johnson",
  "degree": "Bachelor of Science in Computer Science",
  "year": 2026,
  "studentId": "Alice Johnson"
}
```

What the backend does:

1. Validates `studentName`, `degree`, and `year`.
2. Loads `PRIVATE_KEY`, `SEPOLIA_RPC_URL`, and `CONTRACT_ADDRESS` from environment variables.
3. Calls `ensureIssuerReady()`.
4. If the signer is already approved, issuance continues.
5. If the signer is the contract admin but not yet approved, the backend auto-registers that signer as an issuer.
6. If the signer is neither approved nor admin, issuance fails with a `403`.
7. Builds a credential object with:
   - `id`
   - `studentName`
   - `degree`
   - `year`
   - `issuedAt`
   - `version`
8. Hashes the full JSON credential.
9. Signs the hash with the backend private key.
10. Registers the hash and credential type on Sepolia.
11. Stores the full issued credential in backend memory under the student ID.

Successful response includes:

- `credentialId`
- `studentId`
- `credentialHash`
- `blockchainTx`
- `blockNumber`
- `credential`

### 2. Looking Up Credentials in the Wallet

The wallet page calls:

```http
GET /api/wallet/credentials?userId=<lookup>
```

The lookup value can be:

- student ID
- credential ID
- credential hash

What happens:

- The backend searches its in-memory store.
- Matching credentials are returned with summary fields such as `studentName`, `degree`, `year`, `credentialType`, `credentialHash`, and `blockchainTx`.
- The page can then:
  - download the full JSON export
  - request a QR code for the credential hash

Downloaded JSON format:

```json
{
  "credentialHash": "0x...",
  "signature": "0x...",
  "credentialType": "Bachelor of Science in Computer Science",
  "blockchainTx": "0x...",
  "credential": {
    "id": "uuid",
    "studentName": "Alice Johnson",
    "degree": "Bachelor of Science in Computer Science",
    "year": 2026,
    "issuedAt": "2026-03-24T12:00:00.000Z",
    "version": "1.0"
  }
}
```

### 3. Verifying a Credential

The verifier page expects the downloaded JSON file and calls:

```http
POST /api/verify/validate-credential
```

Request body:

```json
{
  "credential": {
    "id": "uuid",
    "studentName": "Alice Johnson",
    "degree": "Bachelor of Science in Computer Science",
    "year": 2026,
    "issuedAt": "2026-03-24T12:00:00.000Z",
    "version": "1.0"
  },
  "signature": "0x...",
  "credentialHash": "0x..."
}
```

What the backend verifies:

1. Recomputes the credential hash from the uploaded JSON.
2. If `credentialHash` was supplied, checks that it matches the recomputed hash.
3. Finds the issuer address from the credential or from the blockchain.
4. Verifies the ECDSA signature against the issuer address.
5. Checks whether the hash is registered and valid on-chain.

Verification behavior:

- If blockchain access is available, final validity is `signatureValid && blockchainValid`.
- If blockchain access is unavailable, the response still reports signature status and marks blockchain as unavailable.

## API Summary

Base URL:

```text
http://localhost:5000/api
```

### Issuer Endpoints

- `POST /issuer/create-credential`
- `POST /issuer/issue-credential`
- `GET /issuer/info`
- `GET /issuer/stats`

### Wallet Endpoints

- `POST /wallet/store`
- `GET /wallet/credentials`
- `GET /wallet/credential/:hash`
- `POST /wallet/qr`
- `GET /wallet/download/:hash`
- `GET /wallet/summary`

### Verifier Endpoints

- `POST /verify/validate-credential`
- `POST /verify/batch`
- `GET /verify/credential/:hash`
- `POST /verify/issuer`
- `POST /verify/report`

### Utility Endpoints

- `GET /`
- `GET /health`
- `GET /api/blockchain/status`

## Project Structure

```text
blockchainAP/
|-- contracts/
|   |-- CredentialRegistry.sol
|   |-- deployments/sepolia.json
|   `-- test/CredentialRegistry.test.js
|-- backend/
|   |-- src/app.js
|   |-- src/controllers/
|   |-- src/routes/
|   `-- src/services/
|-- frontend/
|   |-- src/App.jsx
|   |-- src/pages/
|   |-- src/components/
|   `-- src/services/api.js
|-- scripts/
|   |-- deploy.js
|   `-- seed.js
|-- hardhat.config.js
`-- README.md
```

## Setup

### Prerequisites

- Node.js 16 or newer
- npm
- A Sepolia RPC URL
- A funded Sepolia private key for the backend signer

### 1. Install Dependencies

From the project root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Root `.env` For Hardhat

The root `.env` is used by Hardhat scripts and tests.

Example:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
CONTRACT_ADDRESS=0xyour_contract_address
```

### 3. Configure `backend/.env`

The backend is started from the `backend` folder, so it reads `backend/.env`.

Example:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
CONTRACT_ADDRESS=0xyour_contract_address
PORT=5000
FRONTEND_URL=http://localhost:3000
ISSUER_NAME=SSI Sepolia Issuer
```

### 4. Optional Frontend `.env`

The frontend already defaults to `http://localhost:5000/api`, so this file is optional.

If you want to set it explicitly:

```env
REACT_APP_BACKEND_URL=http://localhost:5000/api
```

## Run The App

### Start The Backend

```bash
npm run backend
```

Backend URLs:

- `http://localhost:5000/`
- `http://localhost:5000/health`
- `http://localhost:5000/api/blockchain/status`

### Start The Frontend

In a separate terminal:

```bash
npm run frontend
```

Frontend URL:

- `http://localhost:3000`

## Smart Contract Commands

Compile:

```bash
npx hardhat compile
```

Deploy to Sepolia:

```bash
npm run deploy-contract
```

Run contract tests:

```bash
npm run test-contract
```

Generate sample data:

```bash
npm run seed
```

## Manual Demo Steps

### Issue

1. Open `http://localhost:3000/issuer`.
2. Enter a student name, degree, and year.
3. Submit the form.
4. Copy the returned wallet lookup ID.
5. Open the Etherscan transaction link shown in the success panel if you want to inspect the transaction.

### Wallet

1. Open `http://localhost:3000/wallet`.
2. Paste the wallet lookup ID, credential ID, or credential hash.
3. Load the credential.
4. Download the JSON file if you want a verifier-friendly export.
5. Generate a QR code if needed.

### Verify

1. Open `http://localhost:3000/verify`.
2. Upload the JSON downloaded from the wallet.
3. Run verification.
4. Review the returned signature and blockchain checks.

## Current Test Status

Running `npm run test-contract` in this repo currently produces partial success:

- 12 tests passing
- 15 tests failing

The failures are from the test suite setup, not from the README:

- missing Hardhat Chai matcher setup for `revertedWith` and `emit`
- direct `BigNumber` to number comparisons
- a call to `credentialExists` as if it were a public function, but it is only a modifier in the contract

## Known Gaps

- No database is connected yet.
- Credentials cannot be recovered from the blockchain alone because the full credential body is not stored on-chain.
- Backend state is single-process memory only.
- There is no authentication layer for issuer, wallet, or verifier users.
- The frontend does not expose issuer registration, approval management, revocation, or restore flows.

## Security Note

Do not commit real private keys. Keep `.env` files out of version control and use a funded testnet wallet only.
