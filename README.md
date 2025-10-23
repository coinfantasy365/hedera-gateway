# CoinFantasy Hedera SDK

> **Open Source TypeScript/JavaScript SDK for Hedera Consensus Service (HCS) and Hedera Token Service (HTS)**

A comprehensive, production-ready SDK for integrating CoinFantasy's Hedera blockchain services into your applications. Built with TypeScript, fully typed, and designed for modern JavaScript/TypeScript projects.

## Features

- **🔗 Hedera Consensus Service (HCS)**: Publish and manage real-time events on Hedera's public ledger
- **🪙 Hedera Token Service (HTS)**: Create, manage, and transfer fungible and non-fungible tokens
- **👛 Multi-Wallet Support**: 
  - **HashPack** browser extension (recommended for web apps)
  - **WalletConnect v2** (for mobile wallets and broader ecosystem)
- **🔒 Type Safety**: Full TypeScript support with comprehensive type definitions
- **⚡ Modern Architecture**: Adapter pattern for extensible wallet integrations
- **🛡️ Error Handling**: Robust error handling with retry logic and detailed error types
- **📦 Modern Build**: CommonJS and ESM module support with tree-shaking
- **🧪 Well Tested**: Comprehensive test suite with >90% coverage
- **📚 Excellent Documentation**: Migration guides, API reference, and examples

## Installation

```bash
npm install @coinfantasy/hedera-sdk
```

### Optional WalletConnect Dependencies

If you want to use WalletConnect (mobile wallets), also install:

```bash
npm install @walletconnect/universal-provider @hashgraph/hedera-wallet-connect
```

> **Note:** HashPack (browser extension) works out of the box without additional dependencies.

## Quick Start

### 1. Initialize SDK

```typescript
import { CoinFantasyHederaSDK } from '@coinfantasy/hedera-sdk';

const sdk = new CoinFantasyHederaSDK({
  network: 'testnet',  // or 'mainnet'
  apiBaseUrl: 'https://api.coinfantasy.io',
  apiKey: 'your-api-key'  // optional
});
```

### 2. Connect Wallet

#### Option A: HashPack (Browser Extension - Recommended)

```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

// Create HashPack adapter
const adapter = createAdapterForChoice('hashpack');
const wallet = new WalletManager(adapter);

// Initialize (no-op for HashPack, but keeps API consistent)
await wallet.init();

// Connect to HashPack extension
const connectionInfo = await wallet.connect();
console.log('Connected:', connectionInfo.accountId);
```

#### Option B: WalletConnect (Mobile Wallets)

```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

// Get free Project ID at: https://cloud.walletconnect.com
const adapter = createAdapterForChoice('walletconnect', {
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  name: 'My DApp',
  description: 'My Hedera DApp',
  url: 'https://mydapp.com',
  icons: ['https://mydapp.com/icon.png']
});

const wallet = new WalletManager(adapter);
await wallet.init();  // Initialize WalletConnect provider
const connectionInfo = await wallet.connect();  // Shows QR code
console.log('Connected:', connectionInfo.accountId, connectionInfo.network);
```

### 3. Use SDK Services

```typescript
// Publish an HCS event
const eventResult = await sdk.hcs.publishEvent({
  eventType: 'USER_ACTION',
  data: { 
    userId: 123, 
    action: 'league_join',
    leagueId: 456 
  },
  metadata: { source: 'web-app' }
});

console.log('Event published:', eventResult.transactionId);

// Create a token
const tokenResult = await sdk.hts.createToken({
  name: 'CoinFantasy Token',
  symbol: 'CFT',
  initialSupply: 1000000,
  decimals: 2
});

console.log('Token created:', tokenResult.tokenId);
```

## API Reference

### SDK Configuration

```typescript
interface SDKConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  network?: 'testnet' | 'mainnet';
}
```

### HCS Manager

#### Publish Event
```typescript
await sdk.hcs.publishEvent({
  type: 'USER_ACTION',
  data: { userId: '123', action: 'draft_pick' },
  timestamp: Date.now()
});
```

#### Subscribe to Events
```typescript
const subscription = sdk.hcs.subscribe('USER_ACTION', (event) => {
  console.log('Received event:', event);
});

// Unsubscribe
subscription.unsubscribe();
```

### HTS Manager

#### Create Token
```typescript
const token = await sdk.hts.createToken({
  name: 'Fantasy Points',
  symbol: 'FPT',
  initialSupply: 1000000,
  decimals: 2,
  treasury: accountId
});
```

#### Mint Tokens
```typescript
await sdk.hts.mintTokens({
  tokenId: '0.0.123456',
  amount: 1000,
  recipient: '0.0.789012'
});
```

#### Create NFT Collection
```typescript
const collection = await sdk.hts.createNFTCollection({
  name: 'CoinFantasy Athletes',
  symbol: 'CFA',
  maxSupply: 10000,
  royaltyFee: 250 // 2.5%
});
```

#### Mint NFT
```typescript
const nft = await sdk.hts.mintNFT({
  tokenId: collection.tokenId,
  metadata: {
    name: 'Legendary Athlete #1',
    description: 'A rare athlete NFT',
    image: 'https://assets.coinfantasy.com/nft/1.jpg',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Sport', value: 'Basketball' }
    ]
  }
});
```

### Wallet Manager

The SDK uses an **adapter pattern** to support multiple wallet providers. You can easily switch between HashPack and WalletConnect, or add custom adapters.

#### Connect HashPack Wallet (Browser Extension)

```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

const adapter = createAdapterForChoice('hashpack');
const wallet = new WalletManager(adapter);

// Check if HashPack is available
if (!wallet.isHashPackAvailable()) {
  console.log('Please install HashPack extension: https://www.hashpack.app/');
  return;
}

await wallet.init();
const account = await wallet.connect();
console.log('Connected account:', account.accountId, account.network);

// Check connection status
console.log('Is connected:', wallet.isConnected());

// Get connection info
const info = wallet.getConnectionInfo();
console.log('Account ID:', info?.accountId);
```

#### Connect with WalletConnect (Mobile)

```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

// Option 1: Explicit configuration
const adapter = createAdapterForChoice('walletconnect', {
  projectId: process.env.WALLETCONNECT_PROJECT_ID!,
  name: 'CoinFantasy',
  description: 'Fantasy sports powered by Hedera',
  url: 'https://coinfantasy.io',
  icons: ['https://coinfantasy.io/icon.png']
});

const wallet = new WalletManager(adapter);
await wallet.init();  // Initializes WalletConnect provider
await wallet.connect();  // Shows QR code or deep link

// Option 2: Use environment variable (auto-detects WALLETCONNECT_PROJECT_ID)
const wallet = new WalletManager();  // Will use WalletConnect if env var is set
await wallet.init();
await wallet.connect();
```

#### Sign Transaction

```typescript
// Build a transaction (example: transfer HBAR)
const transaction = await TransactionId.generate(accountId);
const transferTx = new TransferTransaction()
  .addHbarTransfer(accountId, new Hbar(-10))
  .addHbarTransfer(recipientId, new Hbar(10))
  .setTransactionId(transaction)
  .freeze();

// Sign with wallet
const txBytes = transferTx.toBytes();
const signedTxBytes = await wallet.requestTransaction(txBytes);

// Submit to network
const signedTx = Transaction.fromBytes(signedTxBytes);
const response = await signedTx.execute(client);
const receipt = await response.getReceipt(client);
console.log('Transaction status:', receipt.status.toString());
```

#### Disconnect Wallet

```typescript
await wallet.disconnect();
console.log('Disconnected');
```

#### Backward Compatibility

For existing code using the old HashPack-specific methods:

```typescript
// Still works (uses HashPack adapter internally)
const wallet = new WalletManager();
const isAvailable = wallet.isHashPackAvailable();
if (isAvailable) {
  await wallet.connectHashPack();
}
```

> **Migration Guide:** See [docs/migration.md](./docs/migration.md) for detailed migration steps from HashConnect to WalletConnect.

## Error Handling

The SDK provides comprehensive error handling with specific error types:

```typescript
import { HederaError, WalletError, APIError } from '@coinfantasy/hedera-sdk';

try {
  await sdk.hcs.publishEvent(eventData);
} catch (error) {
  if (error instanceof WalletError) {
    console.error('Wallet connection issue:', error.message);
  } else if (error instanceof HederaError) {
    console.error('Hedera network error:', error.message);
  } else if (error instanceof APIError) {
    console.error('API error:', error.status, error.message);
  }
}
```

## Types

The SDK exports comprehensive TypeScript types for all operations:

```typescript
import type {
  HCSEventData,
  HTSTokenInfo,
  NFTMetadata,
  WalletAccount,
  OperationResult,
  OperationStatus
} from '@coinfantasy/hedera-sdk';
```

## Environment Setup

### Client-Side (React/Vite)

Create a `.env` file:

```bash
# WalletConnect Project ID (get free at https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=af1efc302e1c80d067010fd7c05919de

# API Configuration
VITE_COINFANTASY_API_URL=https://api.coinfantasy.io
VITE_HEDERA_NETWORK=testnet  # or 'mainnet'
```

Usage in code:

```typescript
const adapter = createAdapterForChoice('walletconnect', {
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  name: 'My DApp',
  description: 'My Hedera DApp',
  url: window.location.origin,
  icons: [`${window.location.origin}/icon.png`]
});
```

### Server-Side (Node.js)

Create a `.env` file:

```bash
# Hedera Network Configuration
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.123456
HEDERA_OPERATOR_KEY=302e020100300506032b65700422042...

# HCS Topic (optional)
HCS_TOPIC_ID=0.0.789012

# API Configuration
COINFANTASY_API_URL=https://api.coinfantasy.io
COINFANTASY_API_KEY=your-api-key

# WalletConnect (if using server-side WalletConnect)
WALLETCONNECT_PROJECT_ID=af1efc302e1c80d067010fd7c05919de
```

Load with dotenv:

```typescript
import 'dotenv/config';
import { CoinFantasyHederaSDK } from '@coinfantasy/hedera-sdk';

const sdk = new CoinFantasyHederaSDK({
  network: process.env.HEDERA_NETWORK as 'testnet' | 'mainnet',
  apiBaseUrl: process.env.COINFANTASY_API_URL!,
  apiKey: process.env.COINFANTASY_API_KEY,
  operatorId: process.env.HEDERA_OPERATOR_ID,
  operatorKey: process.env.HEDERA_OPERATOR_KEY
});
```

### Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **WalletConnect Project ID** - Safe to expose client-side (it's a public identifier)
3. **Operator Keys** - Keep private, never expose in client-side code
4. **API Keys** - Use environment variables, rotate regularly

## Examples

Check out the `examples/` directory for complete integration examples:

- [Basic Event Publishing](examples/basic-events.ts)
- [Token Management](examples/token-operations.ts) 
- [NFT Collection Setup](examples/nft-collection.ts)
- [HashPack Wallet Connection](examples/wallet-connection.ts)
- [React Integration with Wallet Context](examples/react-integration.tsx)

### Complete React Example

```typescript
import React, { useState } from 'react';
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

function App() {
  const [wallet, setWallet] = useState<WalletManager | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const connectHashPack = async () => {
    const adapter = createAdapterForChoice('hashpack');
    const wm = new WalletManager(adapter);
    await wm.init();
    const info = await wm.connect();
    setWallet(wm);
    setAccount(info.accountId);
  };

  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
      setWallet(null);
      setAccount(null);
    }
  };

  return (
    <div>
      {!account ? (
        <button onClick={connectHashPack}>Connect HashPack</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

export default App;
```

## Documentation

- 📖 [API Reference](./docs/api-reference.md) - Complete API documentation
- 🔄 [Migration Guide](./docs/migration.md) - Migrate from HashConnect to WalletConnect
- 🔒 [Security Note](./SECURITY_NOTE.md) - Security considerations and advisories
- 📦 [Publishing Guide](./PUBLISHING.md) - How to publish and maintain this SDK
- 🏗️ [Architecture](./docs/architecture.md) - SDK design and patterns
- 🧪 [Testing Guide](./docs/testing.md) - How to run and write tests

## Contributing

We welcome contributions from the community! This is an **open-source project** under the MIT License.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/coinfantasy365/hedera-sdk.git
   cd hedera-sdk
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write tests for new features
   - Update documentation
   - Follow existing code style

4. **Run tests and linting**
   ```bash
   npm install
   npm run build
   npm test
   npm run lint
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for review

### Development Setup

```bash
# Clone the repo
git clone https://github.com/coinfantasy365/hedera-sdk.git
cd hedera-sdk/sdk

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the SDK
npm run build

# Run linter
npm run lint

# Generate docs
npm run docs
```

### Code of Conduct

Please be respectful and professional. We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/).

## Support & Community

- 🐛 **Report Bugs:** [GitHub Issues](https://github.com/coinfantasy365/hedera-sdk/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/coinfantasy365/hedera-sdk/discussions)
- 🔒 **Security:** security@coinfantasy.io
- 📦 **npm Package:** [@coinfantasy/hedera-sdk](https://www.npmjs.com/package/@coinfantasy/hedera-sdk)
- 📚 **Documentation:** [docs.coinfantasy.io](https://docs.coinfantasy.io)

## License

**MIT License** © 2025 CoinFantasy Team

This project is open source and available under the [MIT License](./LICENSE).

You are free to use, modify, and distribute this software. See the [LICENSE](./LICENSE) file for full details.

## Acknowledgments

- **Hedera Hashgraph** - For providing the underlying blockchain infrastructure
- **WalletConnect** - For the wallet connection protocol
- **HashPack** - For the browser wallet extension
- **Community Contributors** - Thank you to everyone who has contributed!

## Project Status

- ✅ **Production Ready** - v1.0.0 released
- ✅ **HCS Integration** - Fully supported
- ✅ **HTS Integration** - Fully supported  
- ✅ **HashPack Wallet** - Fully supported
- ✅ **WalletConnect v2** - Fully supported
- ✅ **TypeScript** - 100% typed
- ✅ **Test Coverage** - >90%
- ✅ **Documentation** - Comprehensive
- ✅ **Open Source** - MIT License

---

**Built with ❤️ by the CoinFantasy Team**  
**Open Source | TypeScript | Hedera Hashgraph**