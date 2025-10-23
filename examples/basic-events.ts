/**
 * Basic Events Example
 * 
 * This example demonstrates how to publish and subscribe to HCS events
 * using the CoinFantasy Hedera SDK.
 */

import { CoinFantasyHederaSDK } from '../src/index';

async function basicEventsExample() {
  // Initialize the SDK
  const sdk = new CoinFantasyHederaSDK({
    apiBaseUrl: 'https://api.coinfantasy.com',
    apiKey: process.env.COINFANTASY_API_KEY,
    network: 'testnet'
  });

  try {
    // Publish different types of events
    
    // User action event
    const userActionResult = await sdk.hcs.publishEvent({
      eventType: 'USER_ACTION',
      data: {
        userId: '123',
        action: 'league_join',
        leagueId: '456',
        timestamp: Date.now()
      }
    });
    
    console.log('User action event published:', userActionResult);

    // Match event
    const matchEventResult = await sdk.hcs.publishEvent({
      eventType: 'MATCH_EVENT',
      data: {
        matchId: '789',
        eventType: 'goal_scored',
        playerId: '101',
        points: 6,
        timestamp: Date.now()
      }
    });

    console.log('Match event published:', matchEventResult);

    // League event
    const leagueEventResult = await sdk.hcs.publishEvent({
      eventType: 'LEAGUE_EVENT',
      data: {
        leagueId: '456',
        eventType: 'draft_completed',
        participantCount: 12,
        timestamp: Date.now()
      }
    });

    console.log('League event published:', leagueEventResult);

    console.log('All events published successfully!');

  } catch (error) {
    console.error('Error in basic events example:', error);
  }
}

// Run the example
if (require.main === module) {
  basicEventsExample().catch(console.error);
}

export { basicEventsExample };