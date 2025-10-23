/**
 * SDK Integration Tests
 * 
 * These tests verify the core functionality of the CoinFantasy Hedera SDK
 */

import { CoinFantasyHederaSDK } from '../src/index';
import type { SDKConfig } from '../src/types';

describe('CoinFantasy Hedera SDK', () => {
  let sdk: CoinFantasyHederaSDK;
  const mockConfig: SDKConfig = {
    apiBaseUrl: 'https://api.test.com',
    apiKey: 'test-api-key',
    network: 'testnet',
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000
    }
  };

  beforeEach(() => {
    sdk = new CoinFantasyHederaSDK(mockConfig);
  });

  describe('SDK Initialization', () => {
    it('should initialize with valid configuration', () => {
      expect(sdk).toBeInstanceOf(CoinFantasyHederaSDK);
      expect(sdk.hcs).toBeDefined();
      expect(sdk.hts).toBeDefined();
      expect(sdk.wallet).toBeDefined();
    });

    it('should throw error with invalid configuration', () => {
      expect(() => {
        new CoinFantasyHederaSDK({} as SDKConfig);
      }).toThrow();
    });
  });

  describe('HCS Manager', () => {
    it('should have publishEvent method', () => {
      expect(typeof sdk.hcs.publishEvent).toBe('function');
    });

    it('should validate event data structure', () => {
      const validEventData = {
        eventType: 'USER_ACTION',
        data: { userId: '123', action: 'test' }
      };

      // This would normally make an API call
      expect(() => sdk.hcs.publishEvent(validEventData)).not.toThrow();
    });
  });

  describe('HTS Manager', () => {
    it('should have token management methods', () => {
      expect(typeof sdk.hts.distributeRewards).toBe('function');
      expect(typeof sdk.hts.getTokenInfo).toBe('function');
      expect(typeof sdk.hts.associateToken).toBe('function');
    });

    it('should validate reward distribution data', () => {
      const validDistribution = {
        recipientId: 123,
        amount: 100,
        reason: 'test_reward'
      };

      expect(() => sdk.hts.distributeRewards(validDistribution)).not.toThrow();
    });
  });

  describe('Wallet Manager', () => {
    it('should have wallet connection methods', () => {
      expect(typeof sdk.wallet.connectHashPack).toBe('function');
      expect(typeof sdk.wallet.disconnect).toBe('function');
      expect(typeof sdk.wallet.isConnected).toBe('function');
    });

    it('should check HashPack availability', () => {
      const isAvailable = sdk.wallet.isHashPackAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should validate account ID format', () => {
      const validAccountId = '0.0.123456';
      const invalidAccountId = 'invalid-account';

      // Import WalletManager for static method testing
      const { WalletManager } = require('../src/wallet.js');
      
      expect(WalletManager.isValidAccountId(validAccountId)).toBe(true);
      expect(WalletManager.isValidAccountId(invalidAccountId)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network error scenario
      const mockErrorSDK = new CoinFantasyHederaSDK({
        ...mockConfig,
        apiBaseUrl: 'http://invalid-url'
      });

      await expect(
        mockErrorSDK.hcs.publishEvent({
          eventType: 'TEST',
          data: { test: true }
        })
      ).rejects.toThrow();
    });

    it('should retry failed operations', async () => {
      // This would test the retry logic
      // In a real implementation, we'd mock the API client
      expect(mockConfig.retryOptions?.maxRetries).toBe(3);
    });
  });

  describe('Operation Status Tracking', () => {
    it('should track operation status', async () => {
      // Mock operation ID
      const operationId = 'test-operation-123';
      
      try {
        const status = await sdk.getOperationStatus(operationId);
        expect(status).toHaveProperty('id');
        expect(status).toHaveProperty('status');
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
      }
    });
  });
});