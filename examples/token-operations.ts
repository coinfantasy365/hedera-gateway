/**
 * Token Operations Example
 * 
 * This example demonstrates HTS token operations including
 * distributing rewards, checking balances, and managing token associations.
 */

import { CoinFantasyHederaSDK } from '../src/index';

async function tokenOperationsExample() {
  // Initialize the SDK
  const sdk = new CoinFantasyHederaSDK({
    apiBaseUrl: 'https://api.coinfantasy.com',
    apiKey: process.env.COINFANTASY_API_KEY,
    network: 'testnet'
  });

  try {
    // Connect wallet first
    console.log('Connecting wallet...');
    const account = await sdk.wallet.connectHashPack();
    console.log('Connected account:', account.accountId);

    // Distribute reward tokens to a user
    console.log('Distributing reward tokens...');
    const rewardResult = await sdk.hts.distributeRewards({
      recipientId: 123,
      amount: 1000,
      reason: 'match_victory',
      metadata: {
        matchId: '456',
        leagueId: '789',
        points: 85
      }
    });
    
    console.log('Rewards distributed:', rewardResult);

    // Check token association status
    const exampleTokenId = '0.0.123456';
    console.log('Checking token association...');
    const associationInfo = await sdk.hts.checkTokenAssociation(
      account.accountId, 
      exampleTokenId
    );
    console.log('Association status:', associationInfo);

    // Associate token if not already associated
    if (!associationInfo.isAssociated) {
      console.log('Associating token with account...');
      const associateResult = await sdk.hts.associateToken(
        account.accountId,
        exampleTokenId
      );
      console.log('Token associated:', associateResult);
    }

    // Get specific token balance
    console.log('Getting token balance...');
    const tokenBalance = await sdk.hts.getTokenBalance(
      account.accountId,
      exampleTokenId
    );
    console.log(`Token balance for ${exampleTokenId}:`, tokenBalance);

    // Get all token balances for the account
    console.log('Getting all token balances...');
    const allBalances = await sdk.hts.getAllTokenBalances(account.accountId);
    console.log('All token balances:', allBalances);

    // Get token information
    console.log('Getting token information...');
    const tokenInfo = await sdk.hts.getTokenInfo(exampleTokenId);
    console.log('Token info:', tokenInfo);

    // Check wallet connection status
    console.log('Checking wallet connection...');
    const connectionStatus = sdk.wallet.isConnected();
    console.log('Wallet connected:', connectionStatus);

    if (connectionStatus) {
      const accountId = sdk.wallet.getAccountId();
      console.log('Connected account ID:', accountId);
    }

  } catch (error) {
    console.error('Error in token operations example:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the example
if (require.main === module) {
  tokenOperationsExample().catch(console.error);
}

export { tokenOperationsExample };