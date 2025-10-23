# SDK Architecture Guide

This document provides a comprehensive overview of the CoinFantasy Hedera SDK architecture, design patterns, and implementation details.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Component Design](#component-design)
- [Data Flow](#data-flow)
- [Design Patterns](#design-patterns)
- [Error Handling Strategy](#error-handling-strategy)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)

---

## Overview

The CoinFantasy Hedera SDK is built with the following principles:

- **Simplicity**: Easy-to-use API with sensible defaults
- **Reliability**: Robust error handling and retry mechanisms
- **Performance**: Optimized for high-throughput scenarios
- **Type Safety**: Full TypeScript support
- **Modularity**: Clean separation of concerns

### Technology Stack

- **Language**: TypeScript 5.0+
- **HTTP Client**: Axios with retry interceptors
- **Build Tool**: TypeScript compiler (tsc)
- **Package Manager**: npm/yarn/pnpm
- **Testing**: Jest with ts-jest

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Import & Initialize
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              CoinFantasyHederaSDK (Main Class)              │
├─────────────────────────────────────────────────────────────┤
│  - Configuration Management                                  │
│  - Service Manager Initialization                            │
│  - HTTP Client Setup                                         │
└───────────┬─────────────┬─────────────┬─────────────────────┘
            │             │             │
    ┌───────▼──────┐  ┌──▼──────┐  ┌──▼───────────┐
    │ HCSManager   │  │ HTSMgr  │  │ WalletMgr    │
    │              │  │         │  │              │
    │ - publish    │  │ - create│  │ - connect    │
    │ - verify     │  │ - mint  │  │ - sign       │
    │ - query      │  │ - distrib│  │ - disconnect │
    └──────┬───────┘  └────┬────┘  └──────┬───────┘
           │               │               │
           └───────────────┴───────────────┘
                           │
                  ┌────────▼─────────┐
                  │   HTTP Client    │
                  │  (with retry)    │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │ Gateway Service  │
                  │  (REST API)      │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │ Hedera Network   │
                  │  (HCS/HTS)       │
                  └──────────────────┘
```

### Module Structure

```
sdk/
├── src/
│   ├── index.ts                 # Main entry point, exports
│   ├── CoinFantasyHederaSDK.ts  # Main SDK class
│   ├── config/
│   │   ├── types.ts             # Configuration types
│   │   └── defaults.ts          # Default configuration
│   ├── managers/
│   │   ├── HCSManager.ts        # HCS operations
│   │   ├── HTSManager.ts        # HTS operations
│   │   └── WalletManager.ts     # Wallet integration
│   ├── http/
│   │   ├── client.ts            # HTTP client setup
│   │   └── interceptors.ts      # Request/response interceptors
│   ├── errors/
│   │   ├── SDKError.ts          # Base error class
│   │   └── codes.ts             # Error codes
│   └── utils/
│       ├── retry.ts             # Retry logic
│       ├── validation.ts        # Input validation
│       └── logger.ts            # Logging utilities
├── examples/                    # Usage examples
├── tests/                       # Test suite
└── docs/                        # Documentation
```

---

## Component Design

### CoinFantasyHederaSDK (Main Class)

**Responsibility**: SDK initialization, configuration management, and service manager coordination.

```typescript
export class CoinFantasyHederaSDK {
  private config: SDKConfig;
  private httpClient: AxiosInstance;
  
  public readonly hcs: HCSManager;
  public readonly hts: HTSManager;
  public readonly wallet: WalletManager;
  
  constructor(config: SDKConfig) {
    this.config = this.validateAndMergeConfig(config);
    this.httpClient = this.createHttpClient();
    
    // Initialize managers
    this.hcs = new HCSManager(this.httpClient, this.config);
    this.hts = new HTSManager(this.httpClient, this.config);
    this.wallet = new WalletManager(this.config);
  }
  
  private createHttpClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.gatewayUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && {
          'Authorization': `Bearer ${this.config.apiKey}`
        })
      }
    });
    
    // Add retry interceptor
    addRetryInterceptor(client, this.config.retryConfig);
    
    return client;
  }
}
```

**Key Features**:
- Centralized configuration
- HTTP client with automatic retry
- Lazy initialization of services
- Thread-safe singleton pattern

### HCSManager

**Responsibility**: Hedera Consensus Service operations.

```typescript
export class HCSManager {
  constructor(
    private httpClient: AxiosInstance,
    private config: SDKConfig
  ) {}
  
  async publishEvent(data: HCSEventData): Promise<HCSPublishResult> {
    // Validate input
    this.validateEventData(data);
    
    // Add default timestamp if not provided
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    // Submit to gateway
    const response = await this.httpClient.post(
      '/api/hedera/gateway/hcs/publish',
      payload
    );
    
    return response.data;
  }
  
  async verifyEvent(params: VerifyParams): Promise<VerificationResult> {
    // Query mirror node for verification
    const response = await this.httpClient.get(
      `/api/hedera/hcs/verify/${params.transactionId}`
    );
    
    return response.data;
  }
  
  async getTopicMessages(params: QueryParams): Promise<TopicMessage[]> {
    // Build query parameters
    const queryString = new URLSearchParams({
      topicId: params.topicId,
      ...(params.startTime && { startTime: params.startTime }),
      ...(params.endTime && { endTime: params.endTime }),
      limit: String(params.limit || 100)
    });
    
    const response = await this.httpClient.get(
      `/api/hedera/hcs/messages?${queryString}`
    );
    
    return response.data.messages;
  }
}
```

**Design Principles**:
- Single responsibility: HCS operations only
- Input validation before API calls
- Consistent error handling
- Chainable operations

### HTSManager

**Responsibility**: Hedera Token Service operations.

```typescript
export class HTSManager {
  constructor(
    private httpClient: AxiosInstance,
    private config: SDKConfig
  ) {}
  
  async createToken(params: CreateTokenParams): Promise<TokenResult> {
    this.validateTokenParams(params);
    
    const response = await this.httpClient.post(
      '/api/hedera/gateway/hts/create',
      params
    );
    
    return response.data;
  }
  
  async distributeRewards(params: DistributionParams): Promise<DistributionResult> {
    // Validate distributions
    this.validateDistributions(params.distributions);
    
    // Check total amount
    const totalAmount = params.distributions.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    
    // Submit batch operation
    const response = await this.httpClient.post(
      '/api/hedera/gateway/hts/distribute',
      {
        tokenId: params.tokenId,
        distributions: params.distributions,
        totalAmount,
        memo: params.memo
      }
    );
    
    return response.data;
  }
  
  async mintNFT(params: MintNFTParams): Promise<NFTResult> {
    // Validate metadata
    this.validateNFTMetadata(params.metadata);
    
    // Serialize metadata to base64
    const metadataBase64 = Buffer.from(
      JSON.stringify(params.metadata)
    ).toString('base64');
    
    const response = await this.httpClient.post(
      '/api/hedera/gateway/hts/mint-nft',
      {
        tokenId: params.tokenId,
        metadata: metadataBase64,
        recipientId: params.recipientId
      }
    );
    
    return response.data;
  }
}
```

**Key Features**:
- Batch operation support
- Metadata serialization
- Balance checking before transfers
- Token association verification

### WalletManager

**Responsibility**: Wallet connectivity and transaction signing.

```typescript
export class WalletManager {
  private connection: WalletConnection | null = null;
  
  constructor(private config: SDKConfig) {}
  
  isHashPackAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.hashpack !== undefined;
  }
  
  async connectHashPack(): Promise<WalletConnection> {
    if (!this.isHashPackAvailable()) {
      throw new SDKError('WALLET_NOT_AVAILABLE', 'HashPack not installed');
    }
    
    // Request connection
    const result = await window.hashpack.connect({
      appName: 'CoinFantasy',
      network: this.config.environment
    });
    
    this.connection = {
      accountId: result.accountId,
      network: result.network,
      publicKey: result.publicKey
    };
    
    // Save to localStorage
    this.saveConnection(this.connection);
    
    return this.connection;
  }
  
  disconnect(): void {
    this.connection = null;
    this.clearConnection();
  }
  
  async signTransaction(transaction: Transaction): Promise<SignedTransaction> {
    if (!this.connection) {
      throw new SDKError('WALLET_NOT_CONNECTED', 'Wallet not connected');
    }
    
    return await window.hashpack.signTransaction(transaction);
  }
}
```

**Browser Integration**:
- Detects HashPack extension
- Manages connection state
- Persists connection in localStorage
- Handles disconnection cleanup

---

## Data Flow

### HCS Event Publishing Flow

```
User Code
    │
    │ sdk.hcs.publishEvent(eventData)
    ▼
HCSManager
    │
    │ 1. Validate event data
    │ 2. Add default timestamp
    │ 3. Create payload
    ▼
HTTP Client
    │
    │ POST /api/hedera/gateway/hcs/publish
    │ Headers: Authorization, Content-Type
    ▼
Gateway Service
    │
    │ 1. Authenticate request
    │ 2. Create operation record
    │ 3. Add to queue
    │ 4. Return operation ID
    ▼
Operation Queue
    │
    │ 1. Persist to database
    │ 2. Process operation
    │ 3. Submit to Hedera
    ▼
Hedera Network
    │
    │ 1. Validate transaction
    │ 2. Achieve consensus
    │ 3. Return consensus timestamp
    ▼
Gateway Service
    │
    │ 1. Update operation status
    │ 2. Store result
    │ 3. Emit event
    ▼
User Code (polling/webhook)
    │
    │ Get operation status
    │ Result: { status: 'COMPLETED', transactionId, consensusTimestamp }
```

### Token Distribution Flow

```
User Code
    │
    │ sdk.hts.distributeRewards(distributions)
    ▼
HTSManager
    │
    │ 1. Validate distributions
    │ 2. Calculate total amount
    │ 3. Check token associations
    ▼
HTTP Client
    │
    │ POST /api/hedera/gateway/hts/distribute
    ▼
Gateway Service
    │
    │ 1. Create multiple transfer operations
    │ 2. Add to queue as batch
    │ 3. Return batch operation ID
    ▼
Queue Processor
    │
    │ For each distribution:
    │   1. Create transfer transaction
    │   2. Sign with treasury key
    │   3. Submit to Hedera
    │   4. Wait for receipt
    ▼
Hedera Network
    │
    │ Execute transfers in sequence
    │ Return transaction receipts
    ▼
Gateway Service
    │
    │ 1. Update all operation statuses
    │ 2. Calculate success rate
    │ 3. Return batch result
    ▼
User Code
    │
    │ Result: { totalAmount, recipientCount, transactionIds }
```

---

## Design Patterns

### 1. Facade Pattern

The SDK acts as a facade, providing a simplified interface to complex Hedera operations.

```typescript
// Complex underlying operations hidden behind simple API
await sdk.hcs.publishEvent(data);
// Internally: validation, HTTP request, queue submission, status tracking
```

### 2. Manager Pattern

Each service (HCS, HTS, Wallet) has a dedicated manager class.

```typescript
// Clear separation of concerns
sdk.hcs   // HCS operations only
sdk.hts   // HTS operations only
sdk.wallet // Wallet operations only
```

### 3. Builder Pattern

Configuration uses a builder-like pattern with defaults.

```typescript
const sdk = new CoinFantasyHederaSDK({
  gatewayUrl: 'https://api.coinfantasy.com',
  environment: 'testnet',
  // Other fields optional with sensible defaults
});
```

### 4. Retry Pattern

Automatic retry for transient failures.

```typescript
// Exponential backoff retry
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!isRetryable(error)) {
        throw error;
      }
      
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}
```

### 5. Promise Pattern

All async operations return promises for easy composition.

```typescript
// Chainable promises
await Promise.all([
  sdk.hcs.publishEvent(event1),
  sdk.hcs.publishEvent(event2),
  sdk.hcs.publishEvent(event3)
]);
```

---

## Error Handling Strategy

### Error Hierarchy

```
Error (JavaScript base)
  │
  └── SDKError (SDK base error)
       │
       ├── NetworkError (HTTP failures)
       ├── ValidationError (Input validation)
       ├── AuthenticationError (Auth failures)
       ├── HederaError (Hedera-specific)
       └── WalletError (Wallet-specific)
```

### Error Codes

```typescript
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_ACCOUNT_ID = 'INVALID_ACCOUNT_ID',
  INVALID_TOKEN_ID = 'INVALID_TOKEN_ID',
  
  // Authentication errors
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_API_KEY = 'INVALID_API_KEY',
  
  // Hedera errors
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TOKEN_NOT_ASSOCIATED = 'TOKEN_NOT_ASSOCIATED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  
  // Wallet errors
  WALLET_NOT_AVAILABLE = 'WALLET_NOT_AVAILABLE',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  USER_REJECTED = 'USER_REJECTED'
}
```

### Error Handling Pattern

```typescript
try {
  await sdk.hcs.publishEvent(data);
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        // Handle network issue
        console.error('Network error:', error.message);
        // Maybe retry
        break;
        
      case 'VALIDATION_ERROR':
        // Handle validation failure
        console.error('Invalid input:', error.details);
        // Fix input and retry
        break;
        
      case 'INSUFFICIENT_BALANCE':
        // Handle low balance
        console.error('Not enough HBAR');
        // Alert user to fund account
        break;
        
      default:
        // Handle unknown error
        console.error('SDK error:', error.code, error.message);
    }
  } else {
    // Handle unexpected error
    console.error('Unexpected error:', error);
  }
}
```

---

## Performance Optimization

### 1. Connection Pooling

HTTP client reuses connections for efficiency.

```typescript
const httpClient = axios.create({
  baseURL: config.gatewayUrl,
  timeout: config.timeout,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
});
```

### 2. Batch Operations

Group multiple operations into batches.

```typescript
// Instead of N individual calls
for (const user of users) {
  await sdk.hts.transfer(...); // ❌ Slow
}

// Use batch operation
await sdk.hts.distributeRewards({  // ✅ Fast
  distributions: users.map(u => ({
    accountId: u.accountId,
    amount: u.reward
  }))
});
```

### 3. Request Deduplication

Prevent duplicate requests for same operation.

```typescript
private pendingRequests = new Map<string, Promise<any>>();

async request(key: string, fn: () => Promise<any>): Promise<any> {
  // Return existing promise if request in progress
  if (this.pendingRequests.has(key)) {
    return this.pendingRequests.get(key)!;
  }
  
  // Execute and cache promise
  const promise = fn().finally(() => {
    this.pendingRequests.delete(key);
  });
  
  this.pendingRequests.set(key, promise);
  return promise;
}
```

### 4. Response Caching

Cache frequently accessed data.

```typescript
private tokenInfoCache = new Map<string, CacheEntry>();

async getTokenInfo(tokenId: string): Promise<TokenInfo> {
  const cached = this.tokenInfoCache.get(tokenId);
  
  if (cached && !this.isExpired(cached)) {
    return cached.data;
  }
  
  const info = await this.fetchTokenInfo(tokenId);
  
  this.tokenInfoCache.set(tokenId, {
    data: info,
    timestamp: Date.now()
  });
  
  return info;
}
```

---

## Security Considerations

### 1. API Key Protection

Never log or expose API keys.

```typescript
// Redact API key in logs
const sanitizeConfig = (config: SDKConfig) => ({
  ...config,
  apiKey: config.apiKey ? '***REDACTED***' : undefined
});
```

### 2. Input Validation

Validate all user input before processing.

```typescript
private validateEventData(data: HCSEventData): void {
  if (!data.eventType || typeof data.eventType !== 'string') {
    throw new ValidationError('eventType is required and must be a string');
  }
  
  if (data.timestamp && !this.isValidISO8601(data.timestamp)) {
    throw new ValidationError('timestamp must be valid ISO8601 format');
  }
}
```

### 3. HTTPS Only

Enforce HTTPS for production.

```typescript
if (config.environment === 'production' && 
    !config.gatewayUrl.startsWith('https://')) {
  throw new SDKError(
    'SECURITY_ERROR',
    'Production environment requires HTTPS'
  );
}
```

### 4. Request Signing

Sign sensitive requests with API key.

```typescript
private signRequest(payload: any): string {
  const message = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', this.config.apiKey!)
    .update(message)
    .digest('hex');
  
  return signature;
}
```

---

## Testing Strategy

### Unit Tests

Test individual components in isolation.

```typescript
describe('HCSManager', () => {
  it('should validate event data', () => {
    const manager = new HCSManager(mockClient, mockConfig);
    
    expect(() => {
      manager.publishEvent({ eventType: '' });
    }).toThrow(ValidationError);
  });
});
```

### Integration Tests

Test SDK against real gateway service.

```typescript
describe('SDK Integration', () => {
  it('should publish HCS event', async () => {
    const sdk = new CoinFantasyHederaSDK({
      gatewayUrl: process.env.TEST_GATEWAY_URL!,
      environment: 'testnet'
    });
    
    const result = await sdk.hcs.publishEvent({
      eventType: 'TEST',
      timestamp: new Date().toISOString()
    });
    
    expect(result.transactionId).toMatch(/^0\.0\.\d+@\d+\.\d+$/);
  });
});
```

### Load Tests

Verify performance under load.

```typescript
describe('Performance', () => {
  it('should handle 100 concurrent requests', async () => {
    const promises = Array.from({ length: 100 }, () =>
      sdk.hcs.publishEvent({ eventType: 'LOAD_TEST' })
    );
    
    const results = await Promise.all(promises);
    
    expect(results.every(r => r.transactionId)).toBe(true);
  });
});
```

---

## Future Enhancements

### Planned Features

1. **WebSocket Support**: Real-time operation status updates
2. **GraphQL Client**: Alternative to REST API
3. **React Native Support**: Mobile wallet integration
4. **Offline Mode**: Queue operations when offline
5. **Advanced Caching**: Redis integration for distributed caching

### Extensibility

The SDK is designed to be extended:

```typescript
// Custom manager
class CustomManager {
  constructor(private httpClient: AxiosInstance) {}
  
  async customOperation(): Promise<any> {
    return await this.httpClient.post('/custom');
  }
}

// Extend SDK
class ExtendedSDK extends CoinFantasyHederaSDK {
  public readonly custom: CustomManager;
  
  constructor(config: SDKConfig) {
    super(config);
    this.custom = new CustomManager(this.httpClient);
  }
}
```

---

For more information, see:
- [API Reference](./api-reference.md)
- [Examples](./examples.md)
- [Integration Guide](../../docs/INTEGRATION_GUIDE.md)

