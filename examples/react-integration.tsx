/**
 * React Integration Example
 * 
 * This example demonstrates how to integrate the CoinFantasy Hedera SDK
 * with React applications using hooks and context providers.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CoinFantasyHederaSDK } from '../src/index';
import type { WalletConnectionInfo, HTSDistributionResult } from '../src/types';

// Types for React integration
interface SDKContextType {
  sdk: CoinFantasyHederaSDK;
  isConnected: boolean;
  connectionInfo: WalletConnectionInfo | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  publishEvent: (eventType: string, data: Record<string, unknown>) => Promise<void>;
  distributeRewards: (recipientId: number, amount: number, reason: string) => Promise<HTSDistributionResult>;
}

// SDK Context
const SDKContext = createContext<SDKContextType | null>(null);

// SDK Provider Props
interface SDKProviderProps {
  children: ReactNode;
  config: {
    apiBaseUrl: string;
    apiKey?: string;
    network: 'testnet' | 'mainnet';
  };
}

// SDK Provider Component
export const SDKProvider: React.FC<SDKProviderProps> = ({ children, config }) => {
  const [sdk] = useState(() => new CoinFantasyHederaSDK(config));
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<WalletConnectionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK and restore connection on mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Try to restore previous connection
        const restored = sdk.wallet.restoreConnection();
        if (restored) {
          setConnectionInfo(restored);
          setIsConnected(true);
        }
      } catch (err) {
        console.warn('Failed to restore wallet connection:', err);
      }
    };

    initializeSDK();
  }, [sdk]);

  // Connect wallet function
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!sdk.wallet.isHashPackAvailable()) {
        throw new Error('HashPack wallet not detected. Please install the HashPack extension.');
      }

      const connection = await sdk.wallet.connectHashPack();
      setConnectionInfo(connection);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    try {
      sdk.wallet.disconnect();
      setConnectionInfo(null);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet';
      setError(errorMessage);
      console.error('Wallet disconnect error:', err);
    }
  };

  // Publish HCS event
  const publishEvent = async (eventType: string, data: Record<string, unknown>) => {
    setError(null);
    try {
      await sdk.hcs.publishEvent({
        eventType,
        data
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish event';
      setError(errorMessage);
      throw err;
    }
  };

  // Distribute rewards
  const distributeRewards = async (recipientId: number, amount: number, reason: string): Promise<HTSDistributionResult> => {
    setError(null);
    try {
      return await sdk.hts.distributeRewards({
        recipientId,
        amount,
        reason
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to distribute rewards';
      setError(errorMessage);
      throw err;
    }
  };

  const contextValue: SDKContextType = {
    sdk,
    isConnected,
    connectionInfo,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    publishEvent,
    distributeRewards
  };

  return (
    <SDKContext.Provider value={contextValue}>
      {children}
    </SDKContext.Provider>
  );
};

// Custom hook to use SDK
export const useSDK = (): SDKContextType => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error('useSDK must be used within an SDKProvider');
  }
  return context;
};

// Wallet Connection Component
export const WalletConnection: React.FC = () => {
  const { isConnected, connectionInfo, isLoading, error, connectWallet, disconnectWallet } = useSDK();

  return (
    <div className="wallet-connection">
      <h3>Wallet Connection</h3>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {!isConnected ? (
        <button 
          onClick={connectWallet} 
          disabled={isLoading}
          className="connect-button"
        >
          {isLoading ? 'Connecting...' : 'Connect HashPack Wallet'}
        </button>
      ) : (
        <div className="connected-info">
          <p><strong>Account:</strong> {connectionInfo?.accountId}</p>
          <p><strong>Network:</strong> {connectionInfo?.network}</p>
          <button onClick={disconnectWallet} className="disconnect-button">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

// Event Publisher Component
export const EventPublisher: React.FC = () => {
  const { publishEvent, isConnected } = useSDK();
  const [eventType, setEventType] = useState('USER_ACTION');
  const [eventData, setEventData] = useState('{"userId": "123", "action": "test"}');
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePublish = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setPublishing(true);
    setSuccess(false);

    try {
      const data = JSON.parse(eventData);
      await publishEvent(eventType, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to publish event:', err);
      alert('Failed to publish event. Check console for details.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="event-publisher">
      <h3>Publish HCS Event</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Event Type:
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          >
            <option value="USER_ACTION">User Action</option>
            <option value="MATCH_EVENT">Match Event</option>
            <option value="LEAGUE_EVENT">League Event</option>
            <option value="DRAFT_EVENT">Draft Event</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Event Data (JSON):
          <textarea
            value={eventData}
            onChange={(e) => setEventData(e.target.value)}
            rows={4}
            cols={50}
            style={{ display: 'block', marginTop: '0.25rem', padding: '0.5rem' }}
          />
        </label>
      </div>

      <button 
        onClick={handlePublish}
        disabled={publishing || !isConnected}
        className="publish-button"
      >
        {publishing ? 'Publishing...' : 'Publish Event'}
      </button>

      {success && (
        <div style={{ color: 'green', marginTop: '0.5rem' }}>
          Event published successfully!
        </div>
      )}
    </div>
  );
};

// Rewards Distributor Component
export const RewardsDistributor: React.FC = () => {
  const { distributeRewards, isConnected } = useSDK();
  const [recipientId, setRecipientId] = useState('123');
  const [amount, setAmount] = useState('100');
  const [reason, setReason] = useState('test_reward');
  const [distributing, setDistributing] = useState(false);
  const [result, setResult] = useState<HTSDistributionResult | null>(null);

  const handleDistribute = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setDistributing(true);
    setResult(null);

    try {
      const distributionResult = await distributeRewards(
        parseInt(recipientId),
        parseInt(amount),
        reason
      );
      setResult(distributionResult);
    } catch (err) {
      console.error('Failed to distribute rewards:', err);
      alert('Failed to distribute rewards. Check console for details.');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="rewards-distributor">
      <h3>Distribute Rewards</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Recipient ID:
          <input
            type="number"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Amount:
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Reason:
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          />
        </label>
      </div>

      <button 
        onClick={handleDistribute}
        disabled={distributing || !isConnected}
        className="distribute-button"
      >
        {distributing ? 'Distributing...' : 'Distribute Rewards'}
      </button>

      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
          <h4>Distribution Result:</h4>
          <p><strong>Operation ID:</strong> {result.operationId}</p>
          <p><strong>Token ID:</strong> {result.tokenId}</p>
          <p><strong>Amount:</strong> {result.amount}</p>
          {result.transactionId && (
            <p><strong>Transaction ID:</strong> {result.transactionId}</p>
          )}
        </div>
      )}
    </div>
  );
};

// Main App Component Example
export const HederaSDKApp: React.FC = () => {
  return (
    <SDKProvider config={{
      apiBaseUrl: 'https://api.coinfantasy.com',
      apiKey: process.env.REACT_APP_COINFANTASY_API_KEY,
      network: 'testnet'
    }}>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>CoinFantasy Hedera SDK React Integration</h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <WalletConnection />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <EventPublisher />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <RewardsDistributor />
        </div>
      </div>
    </SDKProvider>
  );
};

export default HederaSDKApp;