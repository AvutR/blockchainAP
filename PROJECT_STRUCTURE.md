# Project Structure Documentation

This document explains the complete project structure and file organization for the SSI Sepolia system.

---

## 📁 Root Level Files

```
ssi-sepolia-project/
├── package.json              # Root package with build scripts
├── hardhat.config.js         # Hardhat configuration for contracts
├── .env.example             # Environment template
├── README.md                # Main documentation
├── GETTING_STARTED.md       # Quick start guide
└── PROJECT-STRUCTURE.md     # This file
```

### `package.json`
- Root-level npm configuration
- Scripts to build/start all components
- Main dependencies: hardhat, ethers

### `hardhat.config.js`
- Hardhat configuration for smart contracts
- Defines Sepolia network settings
- Configures compiler version

### `.env.example`
- Template for environment variables
- Users copy to `.env` and fill values
- Never commit actual `.env` file

---

## 🔗 Smart Contracts (`/contracts`)

```
contracts/
├── CredentialRegistry.sol    # Main smart contract
├── test/
│   └── CredentialRegistry.test.js   # Contract tests (Chai/Hardhat)
└── artifacts/               # Compiled contract output (auto-generated)
```

### `CredentialRegistry.sol`
- **Purpose**: Blockchain credential registry
- **Key Functions**:
  - `registerCredential()`: Store credential hash on-chain
  - `verifyCredential()`: Check if credential is valid
  - `getIssuer()`: Retrieve issuer address
  - `revokeCredential()`: Mark credential as revoked
- **Data Structures**:
  - `mapping credentials`: Hash → Credential data
  - `mapping issuers`: Address → Issuer info

### `CredentialRegistry.test.js`
- Comprehensive unit tests
- Tests all contract functions
- Uses Chai assertions
- Run with: `npx hardhat test`

---

## 🧠 Backend (`/backend`)

```
backend/
├── src/
│   ├── app.js                    # Express app entry point
│   ├── services/
│   │   ├── cryptoService.js      # Hashing & signing
│   │   ├── blockchainService.js  # Web3 interactions
│   │   └── credentialService.js  # Core business logic
│   ├── controllers/
│   │   ├── issuerController.js   # Issue endpoints
│   │   ├── walletController.js   # Wallet endpoints
│   │   └── verifierController.js # Verify endpoints
│   ├── routes/
│   │   ├── issuerRoutes.js       # /api/issuer routes
│   │   ├── walletRoutes.js       # /api/wallet routes
│   │   └── verifierRoutes.js     # /api/verify routes
│   ├── models/
│   │   └── credentialModel.js    # Data validation/formatting
│   ├── middleware/
│   │   └── errorHandler.js       # Error handling middleware
│   └── config/
│       └── web3.js              # Web3 initialization
├── .env.example                 # Backend .env template
├── package.json                # Backend dependencies
└── README.md                   # Backend documentation (optional)
```

### Services Layer

**cryptoService.js**
- Hash credentials using Keccak256
- Sign with ECDSA (private key)
- Verify signatures (recover public key)
- Utility functions for validation

**blockchainService.js**
- Initialize ethers.js provider
- Deploy/interact with contract
- Query blockchain data
- Handle gas/balance checks

**credentialService.js**
- High-level credential operations
- Orchestrate crypto + blockchain services
- In-memory credential storage
- Coordination logic

### Controllers Layer

**issuerController.js**
- Handles POST `/api/issuer/*` requests
- Creates and issues credentials
- Returns transaction confirmations

**walletController.js**
- Handles `/api/wallet/*` requests
- Stores/retrieves credentials
- Generates QR codes
- Exports credentials

**verifierController.js**
- Handles `/api/verify/*` requests
- Verifies signatures
- Checks blockchain status
- Generates verification reports

### Routes Layer

**issuerRoutes.js**
```
POST   /api/issuer/create-credential    - Create credential only
POST   /api/issuer/issue-credential     - Create + register on-chain
GET    /api/issuer/info                 - Get issuer info
GET    /api/issuer/stats                - Get statistics
```

**walletRoutes.js**
```
POST   /api/wallet/store                - Store credential
GET    /api/wallet/credentials          - List all credentials
GET    /api/wallet/credential/:hash     - Get single credential
POST   /api/wallet/qr                   - Generate QR code
GET    /api/wallet/download/:hash       - Download JSON
GET    /api/wallet/summary              - Get summary
```

**verifierRoutes.js**
```
POST   /api/verify/validate-credential  - Verify credential
POST   /api/verify/batch                - Batch verify
GET    /api/verify/credential/:hash     - Get details
POST   /api/verify/issuer               - Verify issuer
POST   /api/verify/report               - Generate report
```

### Data Flow

```
Browser Request
    ↓
Express Middleware (CORS, logging)
    ↓
Route Handler (matching path/method)
    ↓
Controller (request validation, coordination)
    ↓
Service Layer (business logic)
    ├─ CryptoService (hashing, signing)
    ├─ BlockchainService (Web3 calls)
    └─ CredentialService (coordination)
    ↓
Response (JSON)
```

---

## 🎨 Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── App.jsx                  # Root component with routing
│   ├── App.css                  # Global styles
│   ├── index.js                 # React entry point
│   ├── pages/
│   │   ├── IssuerPage.jsx       # Issuer dashboard
│   │   ├── IssuerPage.css
│   │   ├── WalletPage.jsx       # Student wallet
│   │   ├── WalletPage.css
│   │   ├── VerifierPage.jsx     # Verification portal
│   │   └── VerifierPage.css
│   ├── components/
│   │   ├── Navigation.jsx       # Top nav bar
│   │   ├── Navigation.css
│   │   ├── CredentialCard.jsx   # Credential display
│   │   ├── CredentialCard.css
│   │   ├── QRCodeDisplay.jsx    # QR modal
│   │   ├── QRCodeDisplay.css
│   │   ├── UploadBox.jsx        # Drag-drop upload
│   │   └── UploadBox.css
│   └── services/
│       └── api.js               # API client
├── public/
│   └── index.html              # HTML template
├── .env.example                # Frontend .env
├── package.json                # Frontend dependencies
└── README.md                   # Frontend docs (optional)
```

### Pages

**IssuerPage.jsx**
- Form to create credentials
- Displays issuer info
- Shows transaction results
- Styled with IssuerPage.css

**WalletPage.jsx**
- Student ID input
- Lists all student credentials
- Download buttons
- QR code generation
- Styled with WalletPage.css

**VerifierPage.jsx**
- File upload (drag-drop)
- Displays credential preview
- Verification results
- Blockchain status
- Styled with VerifierPage.css

### Components

**Navigation.jsx**
- Header with logo
- Links to all pages
- Highlight active page
- Network badge (Sepolia)

**CredentialCard.jsx**
- Displays single credential
- Shows key details
- Download button
- QR code button

**QRCodeDisplay.jsx**
- Modal dialog
- Generates QR code
- Shows credential info
- Can be closed

**UploadBox.jsx**
- Drag-and-drop zone
- File browser button
- Accepts .json files
- Visual feedback on drag

### Services/API

**api.js**
- Centralized API client
- Axios-based requests
- Organized by endpoint group:
  - `issuerAPI`
  - `walletAPI`
  - `verifierAPI`
  - `blockchainAPI`
  - `healthAPI`

### Styling

**App.css** (Global)
- CSS variables (colors, spacing)
- Base styles
- Responsible design
- Button styles
- Status messages

**Component CSS**
- Component-specific styles
- Scoped to component
- Nested selectors
- Mobile-first responsive

---

## 🔄 Data Flow Diagram

### Credential Issuance

```
Frontend (IssuerPage)
    ↓ User fills form
Backend API POST /api/issuer/issue-credential
    ↓ issuerController
CredentialService.issueCredential()
    ├─ CryptoService.createCredential()
    │   └─ Hash credential (Keccak256)
    ├─ CryptoService.signCredential()
    │   └─ Sign hash (ECDSA)
    └─ BlockchainService.registerOnChain()
        └─ Send tx to CredentialRegistry.registerCredential()
        └─ Wait for confirmation
    ↓ Return result
Frontend displays:
    - Transaction hash
    - Credential ID
    - Confirmation
```

### Credential Verification

```
Frontend (VerifierPage)
    ↓ User uploads .json file
Parse credential JSON
    ↓ Click "Verify"
Backend API POST /api/verify/validate-credential
    ↓ verifyController
CredentialService.verifyCredential()
    ├─ CryptoService.hashCredential()
    │   └─ Compute hash of credential
    ├─ CryptoService.verifySignature()
    │   └─ Check signature validity
    └─ BlockchainService.verifyOnChain()
        ├─ Check if hash exists on-chain
        └─ Get issuer + status
    ↓ Combine results
Frontend displays:
    - ✅ VALID or ❌ INVALID
    - Signature check result
    - Blockchain check result
    - Issuer address
```

---

## 📊 Database Schema (Current: In-Memory)

### Currently Uses
- JavaScript Map objects in memory
- Credentials cleared on server restart

### Future: MongoDB

```javascript
// Credentials collection
{
  _id: ObjectId,
  credentialHash: String,
  signature: String,
  issuerAddress: String,
  studentId: String,
  credentialType: String,
  blockchainTx: String,
  blockNumber: Integer,
  credentials: Object,
  storageTimestamp: Date
}

// Users collection
{
  _id: ObjectId,
  userId: String,
  credentialIds: [String],
  createdAt: Date
}
```

---

## 🔐 Security Considerations

### Private Keys
- Store ONLY in `.env`
- Never commit to Git
- GitIgnore prevents accidents

### API Authentication
- Currently: No authentication (development)
- Production: Add JWT/OAuth
- Consider issuer registration

### Smart Contract
- Address verification
- Input validation
- Access control (admin)
- Event logging

### Frontend
- Client-side validation
- HTTPS in production
- CSP headers
- XSS protection

---

## 🚀 Deployment Structure

### Smart Contract
- Deploy to Sepolia via Hardhat
- Verify on Etherscan
- Save address in all .env files

### Backend
- Node.js + Express
- Run on VPS, Railway, Render
- Must have:
  - ACCESS to Sepolia RPC
  - Private key for issuer
  - CONTRACT_ADDRESS

### Frontend
- React static bundle
- Deploy to Vercel, Netlify
- Must have:
  - REACT_APP_BACKEND_URL
  - REACT_APP_CONTRACT_ADDRESS

---

## 🧪 Testing Structure

```
contracts/test/
└── CredentialRegistry.test.js  # Hardhat/Chai tests

backend/
└── [No tests currently - add Jest]

frontend/
└── [No tests currently - add Jest]
```

---

## 📝 Configuration Files

### .env.example (Root)
```env
PRIVATE_KEY=
SEPOLIA_RPC_URL=
CONTRACT_ADDRESS=
PORT=5000
```

### backend/.env.example
```env
PORT=5000
PRIVATE_KEY=
SEPOLIA_RPC_URL=
CONTRACT_ADDRESS=
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### frontend/.env.example
```env
REACT_APP_BACKEND_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=
```

---

## 📚 Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Blockchain | Solidity 0.8.20 | Smart contracts |
| Blockchain Interaction | ethers.js v5 | Web3 library |
| Backend Server | Express.js | HTTP server |
| Cryptography | Native ethers | ECDSA signing |
| Frontend Framework | React 18 | UI framework |
| Routing | React Router v6 | Client-side routing |
| HTTP Client | Axios | API calls |
| QR Codes | qrcode.react | QR generation |
| Testing | Chai + Hardhat | Contract tests |
| Build Tools | Hardhat | Contract compilation |

---

## 🔄 Workflow Summary

1. **Issuer** creates credential in UI
2. **Backend** hashes and signs it
3. **Backend** sends hash to blockchain
4. **Blockchain** stores hash permanently
5. **Student** downloads credential JSON
6. **Student** shares credential with verifier
7. **Verifier** uploads credential
8. **Backend** checks signature + blockchain
9. **Frontend** displays ✅ VALID or ❌ INVALID

---

## 🎯 Next Phase Enhancements

- [ ] Add MongoDB database
- [ ] Implement user authentication
- [ ] Add IPFS for full credential storage
- [ ] DID standard integration
- [ ] Revocation checking
- [ ] Multi-issuer support
- [ ] Admin dashboard
- [ ] Analytics/logging
- [ ] Rate limiting
- [ ] API versioning

---

**For more details, see individual README files in each directory.**
