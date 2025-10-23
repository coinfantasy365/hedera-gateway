export interface SDKConfig {
  network: 'testnet' | 'mainnet';
  apiBaseUrl: string;
  apiKey?: string;
  operatorId?: string;
  operatorKey?: string;
  retryOptions?: RetryOptions;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
}

export interface HCSEventData {
  eventType: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface HCSPublishResult {
  operationId: string;
  transactionId?: string;
  consensusTimestamp?: string;
  sequenceNumber?: number;
}

export interface HTSTokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  totalSupply: string;
  decimals?: number;
}

export interface HTSRewardDistribution {
  recipientId: number;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface HTSDistributionResult {
  operationId: string;
  transactionId?: string;
  tokenId: string;
  amount: number;
}

export interface NFTCollectionInfo {
  collectionId: string;
  name: string;
  symbol: string;
  description: string;
  maxSupply?: number;
  royaltyFeeSchedule?: RoyaltyFee[];
}

export interface RoyaltyFee {
  numerator: number;
  denominator: number;
  fallbackFee?: number;
  feeCollectorAccountId: string;
}

export interface NFTMintRequest {
  collectionId: string;
  metadata: NFTMetadata;
  recipientId: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: NFTAttribute[];
  external_url?: string;
  animation_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

export interface NFTMintResult {
  operationId: string;
  transactionId?: string;
  tokenId: string;
  serialNumber: number;
}

export interface WalletConnectionInfo {
  accountId: string;
  network: string;
  publicKey?: string;
}

export interface TokenAssociationInfo {
  tokenId: string;
  accountId: string;
  isAssociated: boolean;
}

export interface OperationStatus {
  id: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  transactionId?: string;
  result?: Record<string, unknown>;
}

export interface GatewayHealth {
  status: string;
  network: string;
  queueSize: number;
  processing: boolean;
  uptime: number;
}

export interface GatewayMetrics {
  totalOperations: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
}

export interface EventVerificationResult {
  eventId: string;
  verified: boolean;
  consensusTimestamp?: string;
  transactionId?: string;
  mirrorNodeData?: Record<string, unknown>;
}

export interface LeagueEventData {
  leagueId: number;
  name: string;
  createdBy: number;
  settings: Record<string, unknown>;
}

export interface MatchEventData {
  matchId: number;
  leagueId: number;
  team1Id: number;
  team2Id: number;
  startTime: string;
  endTime?: string;
  score1?: number;
  score2?: number;
  winner?: number;
}

export interface DraftEventData {
  draftId: number;
  leagueId: number;
  participants: number[];
  picks: Array<{
    userId: number;
    athleteId: number;
    round: number;
    pickNumber: number;
  }>;
}