# Migration Guide: HashConnect to WalletConnect

## Overview

This guide covers the migration from **HashConnect** (deprecated as of 2024) to **WalletConnect v2** for wallet connectivity in the CoinFantasy Hedera SDK.

## Background

HashConnect was deprecated by the Hedera team and is scheduled for shutdown by 2026. The recommended replacement is **WalletConnect v2** via the official [@hashgraph/hedera-wallet-connect](https://github.com/hashgraph/hedera-wallet-connect) library.

Our SDK now supports both:
- **HashPack wallet** (via browser extension using `window.hashpack`)
- **WalletConnect v2** (for mobile wallets and broader ecosystem support)

## Breaking Changes

### 1. Adapter Architecture

The SDK now uses an **adapter pattern** for wallet providers:

**Before (v0.x - HashConnect)**
```typescript
import { WalletManager } from '@coinfantasy/hedera-sdk';

const wallet = new WalletManager();
await wallet.connectHashPack();
```

**After (v1.0 - Adapter Pattern)**
```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

// Option 1: Use HashPack (browser extension)
const hashPackAdapter = createAdapterForChoice('hashpack');
const wallet = new WalletManager(hashPackAdapter);
await wallet.init();
await wallet.connect();

// Option 2: Use WalletConnect v2
const walletConnectAdapter = createAdapterForChoice('walletconnect', {
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from cloud.walletconnect.com
  name: 'CoinFantasy',
  description: 'Fantasy sports powered by Hedera',
  url: 'https://coinfantasy.io',
  icons: ['https://coinfantasy.io/icon.png']
});
const wallet = new WalletManager(walletConnectAdapter);
await wallet.init();
await wallet.connect();
```

### 2. Environment Variables

**WalletConnect requires a Project ID:**

Create a free project at [cloud.walletconnect.com](https://cloud.walletconnect.com) and set:

```bash
# .env (Node.js / server)
WALLETCONNECT_PROJECT_ID=af1efc302e1c80d067010fd7c05919de

# .env (Vite / client)
VITE_WALLETCONNECT_PROJECT_ID=af1efc302e1c80d067010fd7c05919de
```

The SDK will automatically use this environment variable if no adapter is provided:

```typescript
// Automatically uses WALLETCONNECT_PROJECT_ID if set
const wallet = new WalletManager();
await wallet.init();
await wallet.connect();
```

### 3. Dependency Changes

**Remove:**
```json
{
  "dependencies": {
    "hashconnect": "^3.0.14"  // ❌ Remove this
  }
}
```

**Add (optional, only if using WalletConnect):**
```json
{
  "dependencies": {
    "@walletconnect/universal-provider": "^2.22.2",
    "@hashgraph/hedera-wallet-connect": "^2.0.3"
  }
}
```

> **Note:** The SDK lazy-loads WalletConnect libraries, so they're only required at runtime if you use the WalletConnect adapter.

## Migration Steps

### Step 1: Update Dependencies

```bash
# Remove hashconnect
npm uninstall hashconnect

# Install SDK v1.0
npm install @coinfantasy/hedera-sdk@^1.0.0

# (Optional) Install WalletConnect dependencies if using WalletConnect adapter
npm install @walletconnect/universal-provider @hashgraph/hedera-wallet-connect
```

### Step 2: Update Wallet Connection Code

**Choose your adapter:**

#### For HashPack (Browser Extension)

```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

const adapter = createAdapterForChoice('hashpack');
const wallet = new WalletManager(adapter);

// Initialize (no-op for HashPack, but keeps API consistent)
await wallet.init();

// Connect to HashPack extension
const connectionInfo = await wallet.connect();
console.log('Connected:', connectionInfo.accountId);

// Sign a transaction
const signedTx = await wallet.requestTransaction(transactionBytes);

// Disconnect
await wallet.disconnect();
```

#### For WalletConnect v2

```typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

const adapter = createAdapterForChoice('walletconnect', {
  projectId: process.env.WALLETCONNECT_PROJECT_ID!,
  name: 'My DApp',
  description: 'My Hedera DApp',
  url: 'https://mydapp.com',
  icons: ['https://mydapp.com/icon.png']
});

const wallet = new WalletManager(adapter);

// Initialize WalletConnect provider
await wallet.init();

// Connect (will show QR code / pairing UI)
const connectionInfo = await wallet.connect();
console.log('Connected:', connectionInfo.accountId, connectionInfo.network);

// Sign a transaction
const signedTx = await wallet.requestTransaction(transactionBytes);

// Disconnect
await wallet.disconnect();
```

### Step 3: Update React/UI Code

**Example React Context:**

```typescript
import React, { createContext, useState, useContext } from 'react';
import { WalletManager, createAdapterForChoice, WalletConnectionInfo } from '@coinfantasy/hedera-sdk';

interface WalletContextType {
  wallet: WalletManager | null;
  connectionInfo: WalletConnectionInfo | null;
  connect: (walletChoice: 'hashpack' | 'walletconnect') => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletManager | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<WalletConnectionInfo | null>(null);

  const connect = async (walletChoice: 'hashpack' | 'walletconnect') => {
    const adapter = walletChoice === 'hashpack'
      ? createAdapterForChoice('hashpack')
      : createAdapterForChoice('walletconnect', {
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
          name: 'CoinFantasy',
          description: 'Fantasy sports on Hedera',
          url: window.location.origin,
          icons: [`${window.location.origin}/icon.png`]
        });

    const walletManager = new WalletManager(adapter);
    await walletManager.init();
    const info = await walletManager.connect();

    setWallet(walletManager);
    setConnectionInfo(info);
  };

  const disconnect = async () => {
    if (wallet) {
      await wallet.disconnect();
      setWallet(null);
      setConnectionInfo(null);
    }
  };

  return (
    <WalletContext.Provider value={{ wallet, connectionInfo, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
```

### Step 4: Test

1. **HashPack:**
   - Install [HashPack browser extension](https://www.hashpack.app/)
   - Test connect/disconnect/sign flows

2. **WalletConnect:**
   - Use a WalletConnect-compatible Hedera wallet (e.g., HashPack mobile with WalletConnect support if available, or test with WalletConnect test wallet)
   - Scan QR code or use deep link
   - Test connect/disconnect/sign flows

## Backward Compatibility

The SDK maintains backward compatibility for the `connectHashPack()` and `isHashPackAvailable()` methods:

```typescript
// ✅ Still works (uses default adapter)
const wallet = new WalletManager();
const isAvailable = wallet.isHashPackAvailable();
const info = await wallet.connectHashPack();
```

However, **we recommend migrating to the new adapter pattern** for better control and future-proofing.

## Security Considerations

1. **WalletConnect Project ID:**
   - The `projectId` is **not secret** and can be safely committed to client-side code
   - It's used for analytics and rate-limiting by WalletConnect
   - Store it in environment variables for easy rotation

2. **Pinned Dependencies:**
   - We pin `@hashgraph/sdk` to version `2.74.0` for reproducibility
   - WalletConnect packages use `overrides` in package.json to force safe versions

3. **Vulnerability Monitoring:**
   - Run `npm audit` regularly
   - See [SECURITY_NOTE.md](./SECURITY_NOTE.md) for current advisories

## Troubleshooting

### "HashPack wallet not available"

- Ensure [HashPack extension](https://www.hashpack.app/) is installed
- Refresh the page after installing
- Check browser console for errors

### "WalletConnect provider not initialized"

- Verify `projectId` is set correctly
- Ensure `@walletconnect/universal-provider` is installed
- Check network connectivity (WalletConnect requires internet access)

### "No Hedera account returned from WalletConnect session"

- The wallet must support Hedera namespace (`hedera:testnet` or `hedera:mainnet`)
- Check that the wallet is properly configured for Hedera network

## Support

- **SDK Issues:** [GitHub Issues](https://github.com/coinfantasy365/hedera-sdk/issues)
- **WalletConnect Docs:** [docs.walletconnect.com](https://docs.walletconnect.com)
- **Hedera WalletConnect:** [github.com/hashgraph/hedera-wallet-connect](https://github.com/hashgraph/hedera-wallet-connect)

## Changelog

- **v1.0.0** (2025-10-10): Migrated from HashConnect to WalletConnect v2, added adapter pattern
- **v0.x**: Used HashConnect (deprecated)
