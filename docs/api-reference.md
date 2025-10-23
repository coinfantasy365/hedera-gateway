# API Reference

Complete API documentation for the CoinFantasy Hedera SDK.

## Table of Contents

- [CoinFantasyHederaSDK](#coinfantasyhederasdk)
- [HCSManager](#hcsmanager)
- [HTSManager](#htsmanager)
- [WalletManager](#walletmanager)
- [Types](#types)
- [Errors](#errors)

---

## CoinFantasyHederaSDK

Main SDK class providing access to all Hedera services.

### Constructor

```typescript
new CoinFantasyHederaSDK(config: SDKConfig)
```

#### Parameters

- **config**: `SDKConfig` - Configuration object

```typescript
interface SDKConfig {
  gatewayUrl: string;           // Gateway service URL
  environment: 'testnet' | 'mainnet' | 'development';
  apiKey?: string;              // API key for authentication
  timeout?: number;             // Request timeout in ms (default: 30000)
  retryConfig?: RetryConfig;    // Retry configuration
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

interface RetryConfig {
  maxRetries: number;           // Max retry attempts (default: 3)
  baseDelay: number;            // Initial delay in ms (default: 1000)
  maxDelay: number;             // Max delay in ms (default: 10000)
}
```

#### Example

```typescript
const sdk = new CoinFantasyHederaSDK({
  gatewayUrl: 'https://api.coinfantasy.com',
  environment: 'testnet',
  apiKey: 'your-api-key',
  timeout: 30000,
  retryConfig: {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000
  },
  logLevel: 'info'
});
```

### Properties

#### hcs

Type: `HCSManager`

Access to Hedera Consensus Service operations.

```typescript
sdk.hcs.publishEvent(...)
```

#### hts

Type: `HTSManager`

Access to Hedera Token Service operations.

```typescript
sdk.hts.createToken(...)
```

#### wallet

Type: `WalletManager`

Access to wallet integration features.

```typescript
sdk.wallet.connectHashPack()
```

### Methods

#### getOperationStatus()

Get the status of a gateway operation.

```typescript
async getOperationStatus(operationId: string): Promise<OperationStatus>
```

**Parameters:**
- `operationId`: Unique operation identifier

**Returns:** `OperationStatus`

```typescript
interface OperationStatus {
  id: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: string;
}
```

**Example:**

```typescript
const status = await sdk.getOperationStatus('op-123');
console.log('Status:', status.status);
console.log('Attempts:', status.attempts);
```

#### close()

Close SDK connections and clean up resources.

```typescript
async close(): Promise<void>
```

**Example:**

```typescript
await sdk.close();
```

---

## HCSManager

Manages Hedera Consensus Service operations for immutable event logging.

### Methods

#### publishEvent()

Publish an event to HCS topic.

```typescript
async publishEvent(data: HCSEventData): Promise<HCSPublishResult>
```

**Parameters:**

```typescript
interface HCSEventData {
  eventType: string;            // Event type identifier
  timestamp?: string;           // ISO timestamp (default: now)
  metadata?: Record<string, any>; // Event metadata
  [key: string]: any;           // Additional fields
}
```

**Returns:** `HCSPublishResult`

```typescript
interface HCSPublishResult {
  operationId: string;          // Gateway operation ID
  transactionId: string;        // Hedera transaction ID
  consensusTimestamp?: string;  // Consensus timestamp
  topicId: string;              // HCS topic ID
  sequenceNumber?: number;      // Message sequence number
}
```

**Example:**

```typescript
const result = await sdk.hcs.publishEvent({
  eventType: 'MATCH_STARTED',
  matchId: 456,
  leagueId: 123,
  timestamp: new Date().toISOString(),
  metadata: {
    teams: ['Team A', 'Team B'],
    venue: 'Stadium XYZ'
  }
});

console.log('Transaction ID:', result.transactionId);
console.log('Consensus timestamp:', result.consensusTimestamp);
```

**Throws:**
- `SDKError` - If operation fails
- `ValidationError` - If data is invalid

#### verifyEvent()

Verify an event was recorded on HCS.

```typescript
async verifyEvent(params: VerifyParams): Promise<VerificationResult>
```

**Parameters:**

```typescript
interface VerifyParams {
  transactionId: string;        // Transaction to verify
  expectedMessage?: string;     // Expected message content
  topicId?: string;             // Topic ID to check
}
```

**Returns:** `VerificationResult`

```typescript
interface VerificationResult {
  verified: boolean;            // Verification status
  consensusTimestamp?: string;  // Consensus timestamp
  message?: string;             // Message content
  topicId?: string;             // Topic ID
}
```

**Example:**

```typescript
const verification = await sdk.hcs.verifyEvent({
  transactionId: '0.0.123@1638360000.123456789',
  expectedMessage: 'Match started',
  topicId: '0.0.789012'
});

if (verification.verified) {
  console.log('Event verified!');
}
```

#### getTopicMessages()

Query messages from an HCS topic via Mirror Node.

```typescript
async getTopicMessages(params: QueryParams): Promise<TopicMessage[]>
```

**Parameters:**

```typescript
interface QueryParams {
  topicId: string;              // Topic ID to query
  startTime?: string;           // ISO start time
  endTime?: string;             // ISO end time
  limit?: number;               // Max results (default: 100)
  order?: 'asc' | 'desc';       // Sort order (default: 'desc')
}
```

**Returns:** `TopicMessage[]`

```typescript
interface TopicMessage {
  consensusTimestamp: string;   // Consensus timestamp
  message: string;              // Message content
  sequenceNumber: number;       // Sequence number
  runningHash: string;          // Running hash
  topicId: string;              // Topic ID
}
```

**Example:**

```typescript
const messages = await sdk.hcs.getTopicMessages({
  topicId: '0.0.789012',
  startTime: '2025-10-01T00:00:00Z',
  endTime: '2025-10-10T23:59:59Z',
  limit: 50
});

messages.forEach(msg => {
  console.log(`[${msg.consensusTimestamp}] ${msg.message}`);
});
```

---

## HTSManager

Manages Hedera Token Service operations for fungible and non-fungible tokens.

### Methods

#### createToken()

Create a fungible token.

```typescript
async createToken(params: CreateTokenParams): Promise<TokenResult>
```

**Parameters:**

```typescript
interface CreateTokenParams {
  name: string;                 // Token name
  symbol: string;               // Token symbol (3-8 chars)
  decimals: number;             // Decimal places (0-18)
  initialSupply: number;        // Initial supply
  treasuryAccountId: string;    // Treasury account
  adminKey?: string;            // Admin key (private key)
  supplyKey?: string;           // Supply key (private key)
  freezeKey?: string;           // Freeze key (private key)
  wipeKey?: string;             // Wipe key (private key)
  freezeDefault?: boolean;      // Freeze by default
  expirationTime?: string;      // Token expiration
  memo?: string;                // Token memo
}
```

**Returns:** `TokenResult`

```typescript
interface TokenResult {
  operationId: string;          // Gateway operation ID
  tokenId: string;              // Hedera token ID
  transactionId: string;        // Transaction ID
}
```

**Example:**

```typescript
const token = await sdk.hts.createToken({
  name: 'CoinFantasy Reward Token',
  symbol: 'CFR',
  decimals: 2,
  initialSupply: 1000000,
  treasuryAccountId: '0.0.12346',
  adminKey: operatorPrivateKey,
  supplyKey: operatorPrivateKey,
  freezeDefault: false,
  memo: 'CoinFantasy platform reward token'
});

console.log('Token created:', token.tokenId);
```

#### createNFTCollection()

Create a non-fungible token collection.

```typescript
async createNFTCollection(params: NFTCollectionParams): Promise<TokenResult>
```

**Parameters:**

```typescript
interface NFTCollectionParams {
  name: string;                 // Collection name
  symbol: string;               // Collection symbol
  maxSupply?: number;           // Max supply (optional)
  treasuryAccountId: string;    // Treasury account
  adminKey?: string;            // Admin key
  supplyKey?: string;           // Supply key
  customRoyaltyFee?: RoyaltyFee; // Royalty configuration
  memo?: string;                // Collection memo
}

interface RoyaltyFee {
  numerator: number;            // Royalty numerator
  denominator: number;          // Royalty denominator
  fallbackFee: number;          // Fallback fee in HBAR
}
```

**Returns:** `TokenResult`

**Example:**

```typescript
const collection = await sdk.hts.createNFTCollection({
  name: 'CoinFantasy Athletes',
  symbol: 'CFA',
  maxSupply: 10000,
  treasuryAccountId: '0.0.12346',
  adminKey: operatorPrivateKey,
  supplyKey: operatorPrivateKey,
  customRoyaltyFee: {
    numerator: 5,
    denominator: 100,  // 5% royalty
    fallbackFee: 10
  }
});

console.log('NFT collection:', collection.tokenId);
```

#### mintNFT()

Mint a new NFT in a collection.

```typescript
async mintNFT(params: MintNFTParams): Promise<NFTResult>
```

**Parameters:**

```typescript
interface MintNFTParams {
  tokenId: string;              // Collection token ID
  metadata: NFTMetadata;        // NFT metadata
  recipientId?: string;         // Recipient account (optional)
}

interface NFTMetadata {
  name: string;                 // NFT name
  description?: string;         // Description
  image: string;                // Image URL (ipfs:// or https://)
  attributes?: NFTAttribute[];  // Attributes array
  [key: string]: any;           // Additional fields
}

interface NFTAttribute {
  trait_type: string;           // Trait name
  value: string | number;       // Trait value
  display_type?: string;        // Display type
}
```

**Returns:** `NFTResult`

```typescript
interface NFTResult {
  operationId: string;          // Gateway operation ID
  tokenId: string;              // Token ID
  serialNumber: number;         // NFT serial number
  transactionId: string;        // Transaction ID
}
```

**Example:**

```typescript
const nft = await sdk.hts.mintNFT({
  tokenId: '0.0.345679',
  metadata: {
    name: 'Bitcoin - Digital Gold',
    description: 'Legendary athlete card',
    image: 'ipfs://QmXyz123...',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Sport', value: 'Crypto' },
      { trait_type: 'Power', value: 95 }
    ]
  },
  recipientId: '0.0.10001'
});

console.log('NFT minted:', nft.serialNumber);
```

#### distributeRewards()

Distribute fungible tokens to multiple recipients.

```typescript
async distributeRewards(params: DistributionParams): Promise<DistributionResult>
```

**Parameters:**

```typescript
interface DistributionParams {
  tokenId: string;              // Token ID to distribute
  distributions: Distribution[]; // Distribution list
  memo?: string;                // Distribution memo
}

interface Distribution {
  accountId: string;            // Recipient account
  amount: number;               // Amount to transfer
  reason?: string;              // Distribution reason
}
```

**Returns:** `DistributionResult`

```typescript
interface DistributionResult {
  operationId: string;          // Gateway operation ID
  transactionIds: string[];     // Transaction IDs
  totalAmount: number;          // Total distributed
  recipientCount: number;       // Number of recipients
}
```

**Example:**

```typescript
const distribution = await sdk.hts.distributeRewards({
  tokenId: '0.0.345678',
  distributions: [
    { accountId: '0.0.10001', amount: 100, reason: '1st place' },
    { accountId: '0.0.10002', amount: 50, reason: '2nd place' },
    { accountId: '0.0.10003', amount: 25, reason: '3rd place' }
  ],
  memo: 'Match 456 rewards'
});

console.log('Distributed to', distribution.recipientCount, 'winners');
```

#### associateToken()

Associate a token with an account.

```typescript
async associateToken(accountId: string, tokenId: string): Promise<void>
```

**Parameters:**
- `accountId`: Account to associate
- `tokenId`: Token to associate

**Example:**

```typescript
await sdk.hts.associateToken('0.0.10001', '0.0.345678');
console.log('Token associated');
```

#### checkTokenAssociation()

Check if an account has associated a token.

```typescript
async checkTokenAssociation(accountId: string, tokenId: string): Promise<boolean>
```

**Returns:** `boolean` - True if associated

**Example:**

```typescript
const isAssociated = await sdk.hts.checkTokenAssociation(
  '0.0.10001',
  '0.0.345678'
);

if (!isAssociated) {
  await sdk.hts.associateToken('0.0.10001', '0.0.345678');
}
```

#### getTokenBalance()

Get an account's balance for a specific token.

```typescript
async getTokenBalance(accountId: string, tokenId: string): Promise<BalanceInfo>
```

**Returns:** `BalanceInfo`

```typescript
interface BalanceInfo {
  accountId: string;            // Account ID
  tokenId: string;              // Token ID
  balance: number;              // Token balance
  decimals: number;             // Token decimals
  symbol: string;               // Token symbol
}
```

**Example:**

```typescript
const balance = await sdk.hts.getTokenBalance('0.0.10001', '0.0.345678');
console.log(`Balance: ${balance.balance} ${balance.symbol}`);
```

#### getAllTokenBalances()

Get all token balances for an account.

```typescript
async getAllTokenBalances(accountId: string): Promise<BalanceInfo[]>
```

**Returns:** Array of `BalanceInfo`

**Example:**

```typescript
const balances = await sdk.hts.getAllTokenBalances('0.0.10001');

balances.forEach(bal => {
  console.log(`${bal.symbol}: ${bal.balance}`);
});
```

#### getTokenInfo()

Get information about a token.

```typescript
async getTokenInfo(tokenId: string): Promise<TokenInfo>
```

**Returns:** `TokenInfo`

```typescript
interface TokenInfo {
  tokenId: string;              // Token ID
  name: string;                 // Token name
  symbol: string;               // Token symbol
  decimals?: number;            // Decimals (fungible only)
  totalSupply: number;          // Total supply
  treasuryAccountId: string;    // Treasury account
  adminKey?: string;            // Admin key (public)
  supplyKey?: string;           // Supply key (public)
  type: 'FUNGIBLE' | 'NON_FUNGIBLE'; // Token type
}
```

**Example:**

```typescript
const info = await sdk.hts.getTokenInfo('0.0.345678');
console.log(`${info.name} (${info.symbol})`);
console.log(`Total supply: ${info.totalSupply}`);
```

---

## WalletManager

Manages wallet connectivity and transaction signing.

### Methods

#### isHashPackAvailable()

Check if HashPack wallet extension is installed.

```typescript
isHashPackAvailable(): boolean
```

**Returns:** `boolean`

**Example:**

```typescript
if (sdk.wallet.isHashPackAvailable()) {
  console.log('HashPack detected');
} else {
  console.log('Please install HashPack');
}
```

#### connectHashPack()

Connect to HashPack wallet.

```typescript
async connectHashPack(): Promise<WalletConnection>
```

**Returns:** `WalletConnection`

```typescript
interface WalletConnection {
  accountId: string;            // Connected account ID
  network: string;              // Network (testnet/mainnet)
  publicKey: string;            // Public key
}
```

**Example:**

```typescript
const connection = await sdk.wallet.connectHashPack();
console.log('Connected:', connection.accountId);
console.log('Network:', connection.network);
```

#### disconnect()

Disconnect wallet.

```typescript
disconnect(): void
```

**Example:**

```typescript
sdk.wallet.disconnect();
```

#### getAccountId()

Get connected account ID.

```typescript
getAccountId(): string | null
```

**Returns:** Account ID or null if not connected

**Example:**

```typescript
const accountId = sdk.wallet.getAccountId();
if (accountId) {
  console.log('Connected as:', accountId);
}
```

#### signTransaction()

Request wallet to sign a transaction.

```typescript
async signTransaction(transaction: Transaction): Promise<SignedTransaction>
```

**Parameters:**
- `transaction`: Hedera transaction to sign

**Returns:** Signed transaction

**Example:**

```typescript
const transaction = // ... build transaction
const signed = await sdk.wallet.signTransaction(transaction);
```

#### restoreConnection()

Attempt to restore previous wallet connection.

```typescript
restoreConnection(): boolean
```

**Returns:** `boolean` - True if restored

**Example:**

```typescript
if (sdk.wallet.restoreConnection()) {
  console.log('Wallet reconnected');
}
```

---

## Types

### Common Types

```typescript
// Operation status
type OperationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RETRYING';

// Environment
type Environment = 'testnet' | 'mainnet' | 'development';

// Log level
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

---

## Errors

### SDKError

Base error class for all SDK errors.

```typescript
class SDKError extends Error {
  code: string;                 // Error code
  details?: any;                // Additional details
  statusCode?: number;          // HTTP status code
}
```

### Error Codes

- `NETWORK_ERROR`: Network communication failed
- `VALIDATION_ERROR`: Invalid input parameters
- `AUTHENTICATION_ERROR`: Authentication failed
- `INSUFFICIENT_BALANCE`: Not enough HBAR or tokens
- `TOKEN_NOT_ASSOCIATED`: Token not associated with account
- `INVALID_SIGNATURE`: Signature verification failed
- `TIMEOUT`: Operation timed out
- `GATEWAY_ERROR`: Gateway service error
- `HEDERA_ERROR`: Hedera network error

### Error Handling

```typescript
try {
  await sdk.hcs.publishEvent(data);
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        console.error('Network issue:', error.message);
        break;
      case 'INSUFFICIENT_BALANCE':
        console.error('Not enough HBAR');
        break;
      default:
        console.error('SDK error:', error.code, error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## Rate Limits

The SDK respects the following rate limits:

- **HCS publish**: 10 ops/second per account
- **HTS transfer**: 10 ops/second per account
- **Mirror queries**: 100 requests/second
- **Gateway API**: 1000 requests/minute

Rate limit errors return HTTP 429 with retry-after header.

---

## Pagination

For methods returning large result sets, use pagination:

```typescript
let allMessages = [];
let hasMore = true;
let lastTimestamp = null;

while (hasMore) {
  const messages = await sdk.hcs.getTopicMessages({
    topicId: '0.0.789012',
    startTime: lastTimestamp,
    limit: 100
  });
  
  allMessages.push(...messages);
  
  if (messages.length < 100) {
    hasMore = false;
  } else {
    lastTimestamp = messages[messages.length - 1].consensusTimestamp;
  }
}
```

---

For more examples, see [Examples Guide](./examples.md).

