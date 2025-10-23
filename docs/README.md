# CoinFantasy Hedera SDK Documentation

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)

## Overview

The CoinFantasy Hedera SDK is a production-ready TypeScript/JavaScript library that provides a simple, type-safe interface for integrating Hedera blockchain services into your applications. Built specifically for the CoinFantasy fantasy sports platform, it exposes high-level APIs for:

- **Hedera Consensus Service (HCS)**: Immutable event logging with consensus timestamps
- **Hedera Token Service (HTS)**: Token creation, minting, and distribution
- **Wallet Integration**: HashPack wallet connectivity for user transactions
- **Gateway Operations**: Reliable operation queuing with automatic retries

## Quick Links

- [Getting Started](./getting-started.md)
- [API Reference](./api-reference.md)
- [Architecture](./architecture.md)
- [Examples](./examples.md)
- [Migration Guide](./migration-guide.md)
- [FAQ](./faq.md)

## Features

### 🔐 Type-Safe & Reliable

- Full TypeScript support with comprehensive type definitions
- Automatic retry logic with exponential backoff
- Built-in error handling and validation
- Promise-based async/await API

### ⚡ High Performance

- Batch operations support for efficiency
- Connection pooling and caching
- Optimized for high-throughput scenarios
- Load tested with 3,000+ concurrent operations

### 🛡️ Production Ready

- Comprehensive error handling
- Detailed logging and debugging
- Health checks and monitoring
- Battle-tested in production environments

### 🧩 Easy Integration

- Simple, intuitive API design
- Minimal configuration required
- Compatible with Node.js and browser environments
- React hooks and components included

## Installation

### NPM

```bash
npm install @coinfantasy/hedera-sdk
```

### Yarn

```bash
yarn add @coinfantasy/hedera-sdk
```

### PNPM

```bash
pnpm add @coinfantasy/hedera-sdk
```

## Quick Start

```typescript
import { CoinFantasyHederaSDK } from '@coinfantasy/hedera-sdk';

// Initialize SDK
const sdk = new CoinFantasyHederaSDK({
  gatewayUrl: 'https://api.coinfantasy.com',
  environment: 'testnet',
  apiKey: 'your-api-key'
});

// Publish an event to HCS
const result = await sdk.hcs.publishEvent({
  eventType: 'MATCH_STARTED',
  matchId: 123,
  timestamp: new Date().toISOString(),
  metadata: {
    league: 'Premier League',
    teams: ['Team A', 'Team B']
  }
});

console.log('Event published:', result.transactionId);
console.log('Consensus timestamp:', result.consensusTimestamp);

// Distribute rewards via HTS
const distribution = await sdk.hts.distributeRewards({
  tokenId: '0.0.123456',
  distributions: [
    { accountId: '0.0.10001', amount: 100 },
    { accountId: '0.0.10002', amount: 50 }
  ]
});

console.log('Rewards distributed:', distribution.transactionId);
```

## Core Concepts

### Gateway Pattern

The SDK communicates with the CoinFantasy Hedera Gateway, which provides:

- **Operation Queuing**: Reliable message delivery with persistence
- **Retry Logic**: Automatic retries for transient failures
- **Idempotency**: Safe retry of operations without duplication
- **Status Tracking**: Real-time operation status monitoring

```typescript
// Submit operation through gateway
const operation = await sdk.hcs.publishEvent(eventData);

// Track status
const status = await sdk.getOperationStatus(operation.operationId);

console.log('Status:', status.status); // PENDING, IN_PROGRESS, COMPLETED, FAILED
```

### HCS (Hedera Consensus Service)

HCS provides immutable, time-ordered message logging:

- Messages published to topics receive consensus timestamps
- Cannot be altered or deleted after consensus
- Queryable via Mirror Node API
- Perfect for audit trails and compliance

```typescript
// Publish to HCS
const result = await sdk.hcs.publishEvent({
  eventType: 'USER_ACTION',
  userId: 456,
  action: 'place_bet',
  amount: 100
});

// Verify event was recorded
const verified = await sdk.hcs.verifyEvent({
  transactionId: result.transactionId,
  expectedMessage: 'place_bet'
});
```

### HTS (Hedera Token Service)

HTS enables native token operations:

- Create fungible and non-fungible tokens
- Mint tokens to treasury
- Transfer tokens between accounts
- Query balances and metadata
- Low cost (0.001 HBAR per transfer)

```typescript
// Create reward token
const token = await sdk.hts.createToken({
  name: 'CoinFantasy Rewards',
  symbol: 'CFR',
  decimals: 2,
  initialSupply: 1000000
});

// Distribute to users
await sdk.hts.distributeRewards({
  tokenId: token.tokenId,
  distributions: winners.map(user => ({
    accountId: user.hederaAccountId,
    amount: user.reward
  }))
});
```

### Wallet Integration

Connect to user wallets for signing transactions:

```typescript
// Check if HashPack is available
if (sdk.wallet.isHashPackAvailable()) {
  // Connect wallet
  const connection = await sdk.wallet.connectHashPack();
  
  console.log('Connected:', connection.accountId);
  
  // Sign transaction
  const signed = await sdk.wallet.signTransaction(transaction);
}
```

## Architecture

The SDK follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│  (Your app using the SDK)               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      CoinFantasy Hedera SDK             │
├─────────────────────────────────────────┤
│  - HCS Manager                          │
│  - HTS Manager                          │
│  - Wallet Manager                       │
│  - HTTP Client                          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Hedera Gateway Service             │
├─────────────────────────────────────────┤
│  - Operation Queue                      │
│  - Retry Logic                          │
│  - Database Persistence                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Hedera Network                  │
├─────────────────────────────────────────┤
│  - HCS Topics                           │
│  - HTS Tokens                           │
│  - Mirror Nodes                         │
└─────────────────────────────────────────┘
```

See [Architecture Guide](./architecture.md) for detailed information.

## Browser Support

The SDK works in modern browsers with:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

For older browsers, use polyfills for:
- `Promise`
- `fetch`
- `async/await`

## Node.js Support

- Node.js 18.0.0 or higher
- ES Modules (ESM) and CommonJS (CJS) supported

## Examples

### Publishing League Events

```typescript
// Log league creation to HCS
const leagueCreated = await sdk.hcs.publishEvent({
  eventType: 'LEAGUE_CREATED',
  leagueId: 789,
  timestamp: new Date().toISOString(),
  metadata: {
    name: 'Premier League Week 5',
    maxParticipants: 100,
    entryFee: 50,
    prizePool: 4500
  }
});
```

### Minting NFT Rewards

```typescript
// Create NFT collection
const collection = await sdk.hts.createNFTCollection({
  name: 'CoinFantasy Athlete Cards',
  symbol: 'CFA',
  maxSupply: 10000
});

// Mint specific NFT
const nft = await sdk.hts.mintNFT({
  tokenId: collection.tokenId,
  metadata: {
    name: 'Legendary Bitcoin Card',
    image: 'ipfs://QmHash...',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Power', value: 95 }
    ]
  },
  recipientId: '0.0.10001'
});
```

### React Integration

```typescript
import { useCoinFantasySDK } from '@coinfantasy/hedera-sdk/react';

function MyComponent() {
  const { sdk, connected, connect, disconnect } = useCoinFantasySDK({
    gatewayUrl: process.env.REACT_APP_GATEWAY_URL,
    environment: 'testnet'
  });
  
  const handleReward = async () => {
    if (connected) {
      await sdk.hts.distributeRewards({
        tokenId: '0.0.123456',
        distributions: [{ accountId: user.hederaId, amount: 100 }]
      });
    }
  };
  
  return (
    <div>
      {connected ? (
        <button onClick={handleReward}>Claim Reward</button>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Documentation

### Complete Guides

- **[Getting Started](./getting-started.md)**: Installation, setup, and first integration
- **[API Reference](./api-reference.md)**: Complete API documentation
- **[Architecture](./architecture.md)**: System design and patterns
- **[Examples](./examples.md)**: Real-world code examples
- **[Migration Guide](./migration-guide.md)**: Upgrading from previous versions
- **[FAQ](./faq.md)**: Common questions and answers

### Additional Resources

- **[Integration Guide](../../docs/INTEGRATION_GUIDE.md)**: 20+ page comprehensive guide
- **[Troubleshooting](./troubleshooting.md)**: Common issues and solutions
- **[Best Practices](./best-practices.md)**: Recommended patterns
- **[Performance](./performance.md)**: Optimization tips

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

- **GitHub Issues**: https://github.com/coinfantasy365/coinfantasy/issues
- **Email**: dev@coinfantasy.com
- **Discord**: https://discord.gg/coinfantasy
- **Documentation**: https://docs.coinfantasy.com

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and release notes.

---

**Built with ❤️ by the CoinFantasy team**

