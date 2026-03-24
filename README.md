# 🎓 Decentralized Self-Sovereign Student Identity System (SSI) on Sepolia

A production-ready blockchain-based identity management system that enables students to maintain tamper-proof, verifiable academic credentials using Ethereum's Sepolia testnet.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Deployment](#deployment)
8. [Usage](#usage)
9. [API Documentation](#api-documentation)
10. [Testing](#testing)
11. [Bonus Features](#bonus-features)

---

## 🎯 Overview

**SSI Sepolia** implements Self-Sovereign Identity principles by allowing:

- **Students** to own their credentials without central authority
- **Issuers** (universities) to cryptographically sign credentials
- **Verifiers** to validate credentials through blockchain verification
- **Tamper-proof anchoring** using Ethereum smart contracts on Sepolia

### Key Benefits

✅ **Decentralized**: No single point of failure  
✅ **Privacy-Preserving**: Selective disclosure of information  
✅ **Cryptographically Secure**: Signature verification + blockchain anchoring  
✅ **User-Sovereign**: Students fully control their credentials  
✅ **Web3-Ready**: Built with modern blockchain standards  

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐     │
│  │ Issuer Page  │  │ Wallet   │  │ Verifier     │     │
│  │              │  │ Page     │  │ Portal       │     │
│  └──────────────┘  └──────────┘  └──────────────┘     │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API
┌──────────────────────────┴──────────────────────────────┐
│              Backend (Node.js/Express)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Controllers: Issuer | Wallet | Verifier       │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  Services:                                      │   │
│  │  ├─ Crypto Service (hashing, signing)          │   │
│  │  ├─ Blockchain Service (ethers.js)             │   │
│  │  └─ Credential Service (core logic)            │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ ethers.js
┌──────────────────────────┴──────────────────────────────┐
│     Smart Contract (Solidity on Sepolia)                │
│  ┌──────────────────────────────────────────────┐      │
│  │  CredentialRegistry.sol                      │      │
│  │  - registerCredential(hash)                  │      │
│  │  - verifyCredential(hash)                    │      │
│  │  - getIssuer(hash)                           │      │
│  └──────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ssi-sepolia-project/
│
├── contracts/                          # Smart Contracts Layer
│   ├── CredentialRegistry.sol          # Main contract
│   ├── test/                           # Contract tests
│   └── artifacts/                      # Compiled contracts
│
├── backend/                            # Node.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── issuerController.js     # Issue credentials
│   │   │   ├── walletController.js     # Student wallet
│   │   │   └── verifierController.js   # Verification logic
│   │   │
│   │   ├── services/
│   │   │   ├── cryptoService.js        # Cryptographic operations
│   │   │   ├── blockchainService.js    # Web3 interactions
│   │   │   └── credentialService.js    # Core credential logic
│   │   │
│   │   ├── routes/
│   │   │   ├── issuerRoutes.js
│   │   │   ├── walletRoutes.js
│   │   │   └── verifierRoutes.js
│   │   │
│   │   ├── models/
│   │   │   └── credentialModel.js
│   │   │
│   │   ├── config/
│   │   │   └── web3.js                 # Web3 initialization
│   │   │
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   │
│   │   └── app.js                      # Express app setup
│   │
│   ├── .env
│   └── package.json
│
├── frontend/                           # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── IssuerPage.jsx          # Issuer dashboard
│   │   │   ├── WalletPage.jsx          # Student wallet
│   │   │   └── VerifierPage.jsx        # Verification portal
│   │   │
│   │   ├── components/
│   │   │   ├── CredentialCard.jsx      # Credential display
│   │   │   ├── QRCodeDisplay.jsx       # QR code generation
│   │   │   ├── UploadBox.jsx           # File upload
│   │   │   └── Navigation.jsx          # Top navigation
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Backend API calls
│   │   │
│   │   ├── styles/
│   │   │   └── App.css
│   │   │
│   │   ├── App.jsx
│   │   └── index.js
│   │
│   ├── public/
│   └── package.json
│
├── scripts/
│   ├── deploy.js                       # Contract deployment script
│   └── seed.js                         # Test data generation
│
├── .env.example                        # Environment template
├── .gitignore
├── hardhat.config.js                   # Hardhat configuration
├── package.json                        # Root package.json
└── README.md                           # This file


```

---

## 📋 Prerequisites

Ensure you have installed:

- **Node.js** v16+ (https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** for version control
- **MetaMask** browser extension (for testing)

### Sepolia Testnet Setup

1. Get Sepolia ETH from [Sepolia Faucet](https://www.sepoliafaucet.com/)
2. Add Sepolia to MetaMask:
   - Chain ID: 11155111
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_KEY`
   - Currency: ETH

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <your-repo>
cd ssi-sepolia-project
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Setup Environment Variables

```bash
# Copy template
cp .env.example .env

# Edit with your values
# Add your:
# - PRIVATE_KEY (from MetaMask)
# - SEPOLIA_RPC_URL (from Infura/Alchemy)
# - Others as needed
```

---

## ⚙️ Configuration

### Backend Configuration (.env)

```env
PRIVATE_KEY=0x...your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
PORT=5000
```

### Frontend Configuration

Set in `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_CONTRACT_ADDRESS=0x...your_contract
```

---

## 🔗 Deployment

### Step 1: Deploy Smart Contract

```bash
# Compile contract
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

**Output**: Save the contract address from output

### Step 2: Update Configuration

```bash
# Update .env with contract address
CONTRACT_ADDRESS=0x...from_deployment
```

### Step 3: Start Backend

```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Step 4: Start Frontend

```bash
cd frontend
npm start
# React app opens on http://localhost:3000
```

---

## 💻 Usage

### 📝 Issuing a Credential

1. Navigate to **Issuer Page**
2. Fill in credential details:
   - Student Name
   - Degree Name
   - Graduation Year
3. Click "Issue Credential"
4. Approve in MetaMask
5. Transaction confirmed on Sepolia

### 👤 Storing in Wallet

1. Navigate to **Wallet Page**
2. View all received credentials
3. Download as JSON
4. Generate QR code for sharing

### 🔍 Verifying Credential

1. Navigate to **Verifier Page**
2. Upload credential JSON
3. System checks:
   - ✅ Signature validity
   - ✅ Blockchain hash confirmation
   - ✅ Issuer authenticity
4. Results displayed in UI

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Issuer Endpoints

#### Create & Issue Credential

```http
POST /issuer/create-credential
Content-Type: application/json

{
  "studentName": "John Doe",
  "degree": "Bachelor of Science",
  "year": 2024,
  "issuerAddress": "0x..."
}

Response:
{
  "credentialHash": "0xabc123...",
  "signature": "0xdef456...",
  "credential": {
    "studentName": "John Doe",
    "degree": "Bachelor of Science",
    "year": 2024,
    "issuedAt": "2024-03-24T10:30:00Z"
  }
}
```

### Wallet Endpoints

#### Get Stored Credentials

```http
GET /wallet/credentials?userId=student123

Response:
{
  "credentials": [
    {
      "id": "cred_1",
      "studentName": "John Doe",
      "degree": "Bachelor of Science",
      "year": 2024,
      "issuedAt": "2024-03-24T10:30:00Z",
      "credentialHash": "0xabc123..."
    }
  ]
}
```

#### Store Credential

```http
POST /wallet/store
Content-Type: application/json

{
  "userId": "student123",
  "credential": { ...credential object }
}

Response:
{
  "success": true,
  "credentialId": "cred_1"
}
```

### Verifier Endpoints

#### Verify Credential

```http
POST /verify/validate-credential
Content-Type: application/json

{
  "credential": { ...credential object },
  "signature": "0xdef456..."
}

Response:
{
  "isValid": true,
  "signatureValid": true,
  "onChainValid": true,
  "issuerAddress": "0x...",
  "verifiedAt": "2024-03-24T10:35:00Z"
}
```

---

## 🧪 Testing

### Unit Tests (Backend)

```bash
cd backend
npm test
```

### Contract Tests

```bash
npx hardhat test
```

### Manual Testing

1. **Test Issuance**:
   - Go to Issuer Page
   - Create credential
   - Verify MetaMask transaction

2. **Test Storage**:
   - Go to Wallet Page
   - Download credential JSON
   - Verify file structure

3. **Test Verification**:
   - Go to Verifier Page
   - Upload downloaded JSON
   - Verify all checks pass

4. **Test on Block Explorer**:
   - Visit [Sepolia Etherscan](https://sepolia.etherscan.io/)
   - Paste contract address
   - Verify functions called

---

## ⭐ Bonus Features (Implementation Guide)

### 1. IPFS Storage

Store full credential on IPFS, hash on-chain:

```solidity
mapping(bytes32 => string) ipfsCID;

function registerCredentialWithIPFS(bytes32 hash, string memory cid) {
  ipfsCID[hash] = cid;
  // ... rest of logic
}
```

### 2. DID Standard

Implement Decentralized Identifiers:

```
did:ethr:0x1234567890123456789012345678901234567890
```

Format: `did:ethr:<wallet_address>`

### 3. Role-Based Access

Only approved issuers can issue:

```solidity
mapping(address => bool) approvedIssuers;

function registerCredential(bytes32 hash) {
  require(approvedIssuers[msg.sender], "Not an approved issuer");
  // ... rest of logic
}
```

### 4. Revocation System

Allow credential revocation:

```solidity
mapping(bytes32 => bool) revoked;

function revokeCredential(bytes32 hash) {
  require(msg.sender == issuer[hash], "Only issuer can revoke");
  revoked[hash] = true;
}

function isValid(bytes32 hash) returns (bool) {
  return !revoked[hash];
}
```

---

## 🔐 Security Considerations

### Private Key Management

⚠️ **NEVER commit `.env` to version control**

```bash
echo ".env" >> .gitignore
```

### Gas Optimization

- Minimize storage operations
- Batch transactions where possible
- Use events for off-chain indexing

### Input Validation

- Validate all user inputs
- Check address formats
- Verify data types

---

## 🐛 Troubleshooting

### Contract Not Deploying

```bash
# Check Sepolia RPC URL
# Verify private key has balance
# Check hardhat config

npx hardhat accounts --network sepolia
```

### Backend Connection Issues

```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check environment variables
# Verify contract address in .env
```

### Frontend API Errors

```bash
# Check backend is accessible
# Verify CORS is enabled in backend
# Check browser console for details
```

---

## 📊 Monitoring & Logs

### Backend Logs

```bash
tail -f backend/logs/app.log
```

### Transaction Tracking

Visit [Sepolia Etherscan](https://sepolia.etherscan.io/) and search:
- Transaction hash
- Contract address
- Wallet address

---

## 🎓 Learning Resources

- [Ethereum Sepolia](https://www.alchemy.com/overviews/sepolia-testnet)
- [ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Best Practices](https://docs.soliditylang.org/)
- [Self-Sovereign Identity](https://en.wikipedia.org/wiki/Self-sovereign_identity)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Authors

- Your Name
- Your University
- Date: March 2024

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📞 Support

For issues and questions:
- Open GitHub Issue
- Check Discussions
- Email: your-email@example.com

---

**Built with ❤️ for decentralized identity**
