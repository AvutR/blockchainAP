# Getting Started Guide

## 🚀 Quick Start (5 minutes)

### Prerequisites

- Node.js v16+ installed
- Sepolia ETH from [faucet](https://www.sepoliafaucet.com/)
- Text editor (VS Code recommended)

### Step 1: Setup Environment

```bash
# Clone/navigate to project
cd ssi-sepolia-project

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - PRIVATE_KEY: Your MetaMask private key (with Sepolia ETH)
# - SEPOLIA_RPC_URL: From Infura/Alchemy
```

### Step 2: Deploy Smart Contract

```bash
# Install Hardhat dependencies
npm install

# Compile contract
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Output: Contract Address
# Save this address to .env as CONTRACT_ADDRESS
```

### Step 3: Start Backend

```bash
cd backend

# Install dependencies
npm install

# Copy .env template
cp .env.example .env

# Start server
npm start

# Should log: "Server running on http://localhost:5000"
```

### Step 4: Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy .env template
cp .env.example .env

# Start React app
npm start

# Opens: http://localhost:3000
```

### Step 5: Try It Out!

1. **Issue Credential** (Issuer Page)
   - Fill student info
   - Click "Issue Credential"
   - Approve MetaMask transaction
   - ✅ Credential registered on-chain

2. **View Wallet** (Wallet Page)
   - Enter student ID
   - View issued credentials
   - Download as JSON
   - Generate QR code

3. **Verify Credential** (Verifier Page)
   - Upload credential JSON
   - System validates signature + blockchain
   - Shows ✅ VALID or ❌ INVALID

---

## 🔧 Configuration Details

### Environment Variables

**Root (.env)**
```env
PRIVATE_KEY=0x...your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0x...deployed_address
```

**Backend (.env)**
```env
PORT=5000
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=0x...
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**
```env
REACT_APP_BACKEND_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=0x...
```

---

## 📡 Testing the System

### Test Issuance

```bash
curl -X POST http://localhost:5000/api/issuer/issue-credential \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "John Doe",
    "degree": "Bachelor of Science",
    "year": 2024,
    "studentId": "doe_john_2024"
  }'
```

### Test Wallet Query

```bash
curl http://localhost:5000/api/wallet/credentials?userId=doe_john_2024
```

### Test Verification

Upload the JSON from wallet in Verifier Page UI

---

## 🐛 Troubleshooting

### "Contract Address not set"
- Deploy contract first with `npx hardhat run scripts/deploy.js --network sepolia`
- Save address to .env

### "Transaction failed: insufficient funds"
- Get more Sepolia ETH from [faucet](https://www.sepoliafaucet.com/)
- Check with `ethers.provider.getBalance(address)`

### "Backend not responding"
- Ensure backend running: `npm start` in `/backend`
- Check PORT is 5000
- Verify REACT_APP_BACKEND_URL in frontend .env

### "Frontend blank/400 errors"
- Check REACT_APP_BACKEND_URL matches running backend
- Check backend CORS settings
- Clear browser cache

### "Blockchain verification fails"
- Contract may not be deployed
- Check .env CONTRACT_ADDRESS is correct
- Verify on [Etherscan](https://sepolia.etherscan.io/)

---

## 📚 Next Steps

1. **Add Database** - Replace in-memory storage with MongoDB
2. **Deploy Backend** - Use Railway, Render, or Heroku
3. **Deploy Frontend** - Use Vercel or Netlify
4. **Add IPFS** - Store full credentials on IPFS
5. **Implement DID** - Use `did:ethr` standard
6. **Add Revocation** - Allow credential recall
7. **Role-Based Issuers** - Restrict who can issue

---

## 🎓 Key Concepts

**Self-Sovereign Identity (SSI)**
- User owns credential completely
- No central authority needed
- Can share selectively

**Blockchain Anchoring**
- Hash stored permanently on-chain
- Tamper-proof
- Publicly verifiable

**Cryptographic Verification**
- Issuer signs with private key
- Verifier checks with public key
- Proves authenticity

---

## 📞 Support

- Check detailed [README.md](../README.md)
- See [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md)
- Review [API Documentation](../README.md#api-documentation)

---

**Happy credential issuing! 🎓**
