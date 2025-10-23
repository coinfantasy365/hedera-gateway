import { APIClient } from './client.js';
import {
  HTSTokenInfo,
  HTSRewardDistribution,
  HTSDistributionResult,
  NFTCollectionInfo,
  NFTMintRequest,
  NFTMintResult,
  TokenAssociationInfo
} from './types.js';

export class HTSManager {
  constructor(private client: APIClient) {}

  /**
   * Get information about a token
   */
  async getTokenInfo(tokenId: string): Promise<HTSTokenInfo> {
  const response = await this.client.get<{ token: HTSTokenInfo }>(`/hedera/tokens/${tokenId}`);
  return response.token;
  }

  /**
   * Distribute reward tokens to a user
   */
  async distributeRewards(distribution: HTSRewardDistribution): Promise<HTSDistributionResult> {
  const response = await this.client.post<{ operationId: string; transactionId?: string }>('/hedera/gateway/hts/mint', {
      tokenId: process.env.REWARD_TOKEN_ID,
      amount: distribution.amount,
      recipientId: distribution.recipientId,
      metadata: {
        reason: distribution.reason,
        ...distribution.metadata,
        timestamp: new Date().toISOString()
      }
    });

    return {
      operationId: response.operationId,
      transactionId: response.transactionId,
      tokenId: process.env.REWARD_TOKEN_ID || '',
      amount: distribution.amount
    };
  }

  /**
   * Associate a token with a user's account
   */
  async associateToken(accountId: string, tokenId: string): Promise<{ operationId: string }> {
  const response = await this.client.post<{ operationId: string }>('/hedera/gateway/hts/associate', {
      accountId,
      tokenId
    });

    return {
      operationId: response.operationId
    };
  }

  /**
   * Check if a token is associated with an account
   */
  async checkTokenAssociation(accountId: string, tokenId: string): Promise<TokenAssociationInfo> {
  const response = await this.client.get<{ isAssociated: boolean }>(`/hedera/accounts/${accountId}/tokens/${tokenId}/association`);
    
    return {
      tokenId,
      accountId,
      isAssociated: response.isAssociated
    };
  }

  /**
   * Get token balance for an account
   */
  async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
  const response = await this.client.get<{ balance?: number }>(`/hedera/accounts/${accountId}/tokens/${tokenId}/balance`);
  return response.balance || 0;
  }

  /**
   * Get all token balances for an account
   */
  async getAllTokenBalances(accountId: string): Promise<Array<{ tokenId: string; balance: number }>> {
  const response = await this.client.get<{ tokens?: Array<{ tokenId: string; balance: number }> }>(`/hedera/accounts/${accountId}/tokens`);
  return response.tokens || [];
  }

  /**
   * Create a new NFT collection
   */
  async createNFTCollection(collectionInfo: NFTCollectionInfo): Promise<{ operationId: string; collectionId: string }> {
    const response = await this.client.post<{ operationId: string; collectionId: string }>('/hedera/nft/collections', collectionInfo);
    return {
      operationId: response.operationId,
      collectionId: response.collectionId
    };
  }

  /**
   * Mint an NFT to a user
   */
  async mintNFT(mintRequest: NFTMintRequest): Promise<NFTMintResult> {
    const response = await this.client.post<{ operationId: string; transactionId?: string; serialNumber: number }>('/hedera/nft/mint', mintRequest);
    return {
      operationId: response.operationId,
      transactionId: response.transactionId,
      tokenId: mintRequest.collectionId,
      serialNumber: response.serialNumber
    };
  }

  /**
   * Get NFTs owned by an account
   */
  async getNFTs(accountId: string, collectionId?: string): Promise<Array<{
    tokenId: string;
    serialNumber: number;
    metadata: Record<string, unknown>;
  }>> {
    const params = collectionId ? { collectionId } : {};
  const response = await this.client.get<{ nfts?: Array<{ tokenId: string; serialNumber: number; metadata: Record<string, unknown> }> }>(`/hedera/accounts/${accountId}/nfts`, params);
  return response.nfts || [];
  }

  /**
   * Transfer an NFT between accounts
   */
  async transferNFT(
    tokenId: string,
    serialNumber: number,
    fromAccountId: string,
    toAccountId: string
  ): Promise<{ operationId: string }> {
  const response = await this.client.post<{ operationId: string }>('/hedera/nft/transfer', {
      tokenId,
      serialNumber,
      fromAccountId,
      toAccountId
    });

    return {
      operationId: response.operationId
    };
  }

  /**
   * Batch distribute rewards to multiple users
   */
  async batchDistributeRewards(distributions: HTSRewardDistribution[]): Promise<HTSDistributionResult[]> {
    const promises = distributions.map(distribution => this.distributeRewards(distribution));
    return Promise.all(promises);
  }

  /**
   * Get reward distribution history for a user
   */
  async getRewardHistory(
    userId: number,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<Array<{
    id: string;
    amount: number;
    reason: string;
    timestamp: string;
    transactionId?: string;
  }>> {
  const response = await this.client.get<{ rewards?: Array<{ id: string; amount: number; reason: string; timestamp: string; transactionId?: string }> }>(`/hedera/users/${userId}/rewards`, options);
  return response.rewards || [];
  }
}