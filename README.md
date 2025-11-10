# 🚀 ERC-4337 Batch Token Deployer

A complete ERC-4337 Account Abstraction implementation that allows you to deploy multiple ERC-20 tokens in a single UserOperation. Built with Foundry for smart contracts and React + Vite for the frontend.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [How It Works](#how-it-works)
- [Contract Addresses](#contract-addresses)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This project demonstrates ERC-4337 Account Abstraction by:

- ✅ Creating a Smart Contract Wallet (SmartAccount) for each user
- ✅ Deploying multiple ERC-20 tokens in a single transaction
- ✅ Using ERC-1167 minimal proxies for gas efficiency
- ✅ Manual UserOperation construction (no bundler SDKs)
- ✅ Complete frontend UI with MetaMask integration

**Key Features:**
- Batch deploy multiple tokens in one go
- Gas-efficient token deployment using clones
- Tokens automatically owned by your SmartAccount
- Beautiful React frontend with real-time status updates
- Auto-switches to Sepolia testnet

---

## 🏗️ Architecture

### On-Chain Components

1. **EntryPoint** (`0x0000000071727De22E5E9d8BAf0edAc6f37da032`)
   - Official ERC-4337 EntryPoint (deployed by Ethereum Foundation)
   - Validates and executes UserOperations
   - Same address on all networks

2. **SmartAccountFactory** (`0x8838EA1d2188f63f9187573A77d4b0B31193086D`)
   - Creates SmartAccount instances using CREATE2
   - Predictable addresses (can calculate before deployment)

3. **SmartAccount** (created per user)
   - Your smart contract wallet
   - Validates signatures and executes calls
   - Only EntryPoint can call `execute()`

4. **BatchTokenFactory** (`0xa667A04fBe2FDFD3d16c14C60EC1C300e7190d85`)
   - Deploys multiple ERC-20 tokens using ERC-1167 clones
   - Gas-efficient batch deployment

5. **MinimalERC20** (`0xaFd482eE83aD8b292b95529E6D375345d61575Db`)
   - Cloneable ERC-20 implementation
   - Used as template for all tokens

### Off-Chain Components

1. **Frontend** (React + Vite + Tailwind CSS)
   - User interface for token deployment
   - MetaMask integration
   - UserOperation construction and signing

2. **Smart Contracts** (Foundry)
   - All contract logic
   - Tests and deployment scripts

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **Foundry** (for Solidity compilation)
- **MetaMask** browser extension
- **Sepolia ETH** (for gas fees)

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Verify installation:
```bash
forge --version
```

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd 4337
```

### 2. Install Dependencies

**Backend (Root):**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

**Foundry Dependencies:**
```bash
forge install foundry-rs/forge-std
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
# RPC Configuration
RPC_URL=https://rpc.sepolia.org

# Your wallet private key (with 0x prefix)
DEPLOYER_PRIVATE_KEY=0x...
SMART_ACCOUNT_OWNER_KEY=0x...

# EntryPoint (official ERC-4337 address)
ENTRYPOINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032

# Deposit Configuration
DEPOSIT_AMOUNT=0.1
```



---

## 🚀 Setup

### Step 1: Deploy Contracts

Deploy all contracts to Sepolia testnet:

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

This deploys:
- MinimalERC20 implementation
- BatchTokenFactory
- SmartAccountFactory

**Note:** EntryPoint is already deployed (official ERC-4337 address).

After deployment, update `deployments.json` with the deployed addresses:

```json
{
  "entryPoint": "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  "minimalERC20Implementation": "0x...",
  "batchTokenFactory": "0x...",
  "smartAccountFactory": "0x..."
}
```

Also update `frontend/src/utils/constants.ts` with the same addresses.

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start at `http://localhost:5173`

---

## 💻 Usage

### Using the Frontend (Recommended)

1. **Open the Frontend**
   - Navigate to `http://localhost:5173`
   - The app will automatically prompt you to connect MetaMask

2. **Connect MetaMask**
   - Click "Connect MetaMask"
   - Approve the connection
   - The app will automatically switch to Sepolia testnet

3. **Create SmartAccount** (if needed)
   - If you don't have a SmartAccount, click "Create Account"
   - Approve the transaction in MetaMask
   - Wait for confirmation (~15 seconds)

4. **Fund Your SmartAccount**
   - ⚠️ **IMPORTANT:** Your SmartAccount needs ETH to pay for gas!
   - Send at least **0.02 ETH** to your SmartAccount address
   - Use MetaMask: Send → Paste SmartAccount address → Send 0.02 ETH

5. **Add Tokens to Deploy**
   - Fill in token details:
     - Name: e.g., "MyAwesomeToken"
     - Symbol: e.g., "MAT"
     - Initial Supply: e.g., "1000000"
   - Click "Add Token"
   - Repeat for multiple tokens

6. **Deploy Tokens**
   - Click "Deploy X Tokens via ERC-4337"
   - You'll see two MetaMask popups:
     - First: "Sign Message" (for UserOperation)
     - Second: "Confirm Transaction" (to submit to EntryPoint)
   - Approve both
   - Wait for confirmation
   - ✅ Tokens deployed!

### Using Command Line (Alternative)

If you prefer command line:

```bash
# Create SmartAccount
npm run create-account

# Deploy tokens (requires scripts - currently removed)
# Use frontend instead!
```

---

## 🔄 How It Works

### Phase 1: Create SmartAccount

```
1. User clicks "Create Account"
   ↓
2. Frontend calls SmartAccountFactory.createAccount()
   ↓
3. SmartAccountFactory deploys SmartAccount using CREATE2
   ↓
4. SmartAccount constructor sets:
   - owner = Your wallet address
   - entryPoint = Official EntryPoint
   - nonce = 0
   ↓
5. ✅ SmartAccount created!
```

**Contract Calls:**
- `YOUR WALLET` → `SmartAccountFactory.createAccount()`
- `SmartAccountFactory` → Creates `SmartAccount` (constructor)

### Phase 2: Deploy Tokens via ERC-4337

```
1. User fills token form and clicks "Deploy Tokens"
   ↓
2. Frontend prepares:
   - Token parameters
   - Encodes BatchTokenFactory call
   - Encodes SmartAccount.execute() call
   ↓
3. Frontend builds UserOperation:
   - sender: SmartAccount address
   - callData: execute(BatchTokenFactory, ...)
   - signature: (empty, will add)
   ↓
4. Frontend signs UserOperation:
   - Hashes UserOperation
   - Signs with YOUR wallet (MetaMask)
   - Adds signature to UserOperation
   ↓
5. Frontend submits to EntryPoint:
   - entryPoint.handleOps([userOp], beneficiary)
   - MetaMask popup for transaction approval
   ↓
6. EntryPoint processes:
   - Calls SmartAccount.validateUserOp() ✅
   - Validates signature matches owner
   - Calls SmartAccount.execute() ✅
   ↓
7. SmartAccount executes:
   - Calls BatchTokenFactory.batchDeployTokens()
   ↓
8. BatchTokenFactory deploys tokens:
   - Clones MinimalERC20 (ERC-1167)
   - Initializes each clone
   - Sets SmartAccount as owner
   ↓
9. ✅ Tokens deployed!
```

**Contract Calls (in order):**
1. `YOUR WALLET` → `EntryPoint.handleOps([userOp])`
2. `EntryPoint` → `SmartAccount.validateUserOp()` (validates signature)
3. `EntryPoint` → `SmartAccount.execute()` (executes call)
4. `SmartAccount` → `BatchTokenFactory.batchDeployTokens()`
5. `BatchTokenFactory` → `_clone()` × 2 (creates token proxies)
6. `BatchTokenFactory` → `MinimalERC20.initialize()` × 2 (initializes tokens)

### Key Concepts

**UserOperation:**
- Special transaction format for ERC-4337
- Contains: sender (SmartAccount), callData, signature
- Goes through EntryPoint instead of directly to blockchain

**EntryPoint:**
- Security layer that validates all UserOperations
- Only EntryPoint can call `SmartAccount.execute()`
- Prevents unauthorized access

**SmartAccount:**
- Your smart contract wallet
- Validates signatures before executing
- Can execute arbitrary calls (like deploying tokens)

**ERC-1167 Minimal Proxies:**
- Gas-efficient way to deploy multiple contracts
- One implementation, many tiny proxies
- Each proxy has its own storage

---

## 📍 Contract Addresses

### Sepolia Testnet

All contracts are deployed on Sepolia. Update these in `frontend/src/utils/constants.ts`:

```typescript
export const ADDRESSES = {
  entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',  // Official
  minimalERC20Implementation: '0xaFd482eE83aD8b292b95529E6D375345d61575Db',
  batchTokenFactory: '0xa667A04fBe2FDFD3d16c14C60EC1C300e7190d85',
  smartAccountFactory: '0x8838EA1d2188f63f9187573A77d4b0B31193086D',
};
```

**Verify on Etherscan:**
- EntryPoint: https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032
- BatchTokenFactory: https://sepolia.etherscan.io/address/0xa667A04fBe2FDFD3d16c14C60EC1C300e7190d85
- SmartAccountFactory: https://sepolia.etherscan.io/address/0x8838EA1d2188f63f9187573A77d4b0B31193086D

---

## 🐛 Troubleshooting

### Frontend Issues

**"MetaMask is not installed"**
- Install MetaMask browser extension
- Refresh the page

**"Failed to switch network"**
- Manually add Sepolia to MetaMask:
  - Network Name: Sepolia
  - RPC URL: https://rpc.sepolia.org
  - Chain ID: 11155111
  - Currency: ETH

**"Bad address checksum"**
- Update contract addresses in `frontend/src/utils/constants.ts`
- Make sure addresses match `deployments.json`
- Use checksummed addresses (with proper capitalization)

**"Missing revert data" or "CALL_EXCEPTION"**
- ⚠️ **Your SmartAccount needs ETH!**
- Send at least 0.02 ETH to your SmartAccount address
- Check balance in the UI
- Try again after funding

**"Transaction was rejected"**
- You rejected the transaction in MetaMask
- Try again and approve the transaction

### Contract Deployment Issues

**"Source not found"**
```bash
forge install foundry-rs/forge-std
```

**"Failed parsing private key"**
- Make sure private key has `0x` prefix in `.env`
- Example: `DEPLOYER_PRIVATE_KEY=0x1234...`

**"Insufficient funds"**
- Make sure your wallet has Sepolia ETH
- Get testnet ETH from: https://sepoliafaucet.com/

### SmartAccount Issues

**"SmartAccount not found"**
- Create SmartAccount first using the frontend
- Or use: `npm run create-account`

**"Nonce mismatch"**
- Wait a few seconds and try again
- The nonce might have changed

---

## 📁 Project Structure

```
4337/
├── contracts/              # Smart contracts
│   ├── account/
│   │   ├── SmartAccount.sol
│   │   ├── SmartAccountFactory.sol
│   │   └── interfaces/
│   ├── tokens/
│   │   ├── MinimalERC20.sol
│   │   └── BatchTokenFactory.sol
│   └── erc4337/
│       └── IEntryPoint.sol
├── script/                  # Deployment scripts
│   └── Deploy.s.sol
├── test/                    # Foundry tests
│   ├── SmartAccount.t.sol
│   └── BatchTokenFactory.t.sol
├── frontend/                # React frontend
│   ├── src/
│   │   ├── App.tsx          # Main app
│   │   ├── components/      # UI components
│   │   └── utils/           # Web3 utilities
│   └── package.json
├── deployments.json         # Deployed addresses
├── foundry.toml            # Foundry config
├── .env                    # Environment variables
└── README.md               # This file
```

---



## 📚 Learn More

- **ERC-4337 Specification**: https://eips.ethereum.org/EIPS/eip-4337
- **OpenZeppelin Account Abstraction**: https://docs.openzeppelin.com/contracts/5.x/account-abstraction
- **ERC-1167 Minimal Proxies**: https://eips.ethereum.org/EIPS/eip-1167
- **Foundry Documentation**: https://book.getfoundry.sh/

---

## 📝 License

MIT

---

## ⚠️ Disclaimer

This is experimental software for educational purposes. Always audit smart contracts before deploying with real funds. Use at your own risk.

---

**Built with ❤️ for the ERC-4337 ecosystem**
