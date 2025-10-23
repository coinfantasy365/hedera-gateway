/**
 * Wallet Connection Example
 * 
 * This example demonstrates wallet connection, disconnection,
 * and various wallet utilities.
 */

import { CoinFantasyHederaSDK } from '../src/index';

async function walletConnectionExample() {
  // Initialize the SDK
  const sdk = new CoinFantasyHederaSDK({
    apiBaseUrl: 'https://api.coinfantasy.com',
    apiKey: process.env.COINFANTASY_API_KEY,
    network: 'testnet'
  });

  try {
    // Check if HashPack is available
    console.log('Checking for HashPack wallet...');
    const isHashPackAvailable = sdk.wallet.isHashPackAvailable();
    console.log('HashPack available:', isHashPackAvailable);

    if (!isHashPackAvailable) {
      console.log('HashPack wallet not detected. Please install the HashPack extension.');
      return;
    }

    // Try to restore previous connection
    console.log('Attempting to restore previous connection...');
    const restoredConnection = sdk.wallet.restoreConnection();
    if (restoredConnection) {
      console.log('Previous connection restored:', restoredConnection);
    } else {
      console.log('No previous connection found.');
    }

    // Connect to HashPack wallet
    console.log('Connecting to HashPack wallet...');
    const connectionInfo = await sdk.wallet.connectHashPack();
    console.log('Wallet connected successfully:', connectionInfo);

    // Check connection status
    const isConnected = sdk.wallet.isConnected();
    console.log('Wallet connected:', isConnected);

    // Get connected account ID
    const accountId = sdk.wallet.getAccountId();
    console.log('Connected account ID:', accountId);

    // Validate account ID format and use utilities
    if (accountId) {
      // Import WalletManager for static methods
      const { WalletManager } = await import('../src/wallet.js');
      
      const isValidFormat = WalletManager.isValidAccountId(accountId);
      console.log('Account ID format valid:', isValidFormat);

      // Format account ID for display
      const formattedId = WalletManager.formatAccountId(accountId);
      console.log('Formatted account ID:', formattedId);

      // Get HashScan URLs
      const accountUrl = WalletManager.getHashScanAccountUrl(accountId, 'testnet');
      console.log('HashScan account URL:', accountUrl);
    }

    // Demonstrate error handling for transaction requests
    try {
      console.log('Attempting transaction request (will fail - not implemented)...');
      await sdk.wallet.requestTransaction(new Uint8Array([1, 2, 3]));
    } catch (error) {
      console.log('Expected error for transaction request:', (error as Error).message);
    }

    // Simulate working with the connected wallet
    console.log('Performing operations with connected wallet...');
    
    // Check token associations
    const exampleTokenId = '0.0.123456';
    try {
      const tokenAssociation = await sdk.hts.checkTokenAssociation(accountId!, exampleTokenId);
      console.log('Token association check:', tokenAssociation);
    } catch (error) {
      console.log('Token association check failed (expected):', (error as Error).message);
    }

    // Get all token balances
    try {
      const allBalances = await sdk.hts.getAllTokenBalances(accountId!);
      console.log('All token balances:', allBalances);
    } catch (error) {
      console.log('Balance check failed (expected):', (error as Error).message);
    }

    // Disconnect wallet
    console.log('Disconnecting wallet...');
    sdk.wallet.disconnect();
    
    const isConnectedAfterDisconnect = sdk.wallet.isConnected();
    console.log('Wallet connected after disconnect:', isConnectedAfterDisconnect);

    console.log('Wallet connection example completed successfully!');

  } catch (error) {
    console.error('Error in wallet connection example:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the example
if (require.main === module) {
  walletConnectionExample().catch(console.error);
}

export { walletConnectionExample };