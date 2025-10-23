/**
 * NFT Collection Example
 * 
 * This example demonstrates creating NFT collections and minting NFTs
 * with metadata and royalty configuration.
 */

import { CoinFantasyHederaSDK } from '../src/index';

async function nftCollectionExample() {
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

    // Create an NFT collection for athlete cards
    console.log('Creating athlete NFT collection...');
    const athleteCollection = await sdk.hts.createNFTCollection({
      collectionId: '', // Will be set by the service
      name: 'CoinFantasy Athletes',
      symbol: 'CFA',
      description: 'Rare athlete trading cards for fantasy sports',
      maxSupply: 10000,
      royaltyFeeSchedule: [{
        numerator: 5, // 5%
        denominator: 100,
        feeCollectorAccountId: account.accountId
      }]
    });
    
    console.log('Athlete collection created:', athleteCollection);

    // Create collection for achievement badges
    console.log('Creating achievement badge collection...');
    const badgeCollection = await sdk.hts.createNFTCollection({
      collectionId: '', // Will be set by the service
      name: 'CoinFantasy Badges',
      symbol: 'CFB',
      description: 'Achievement badges for fantasy sports milestones',
      maxSupply: 50000,
      royaltyFeeSchedule: [{
        numerator: 25, // 2.5%
        denominator: 1000,
        feeCollectorAccountId: account.accountId
      }]
    });
    
    console.log('Badge collection created:', badgeCollection);

    // Mint an athlete NFT
    if (athleteCollection.collectionId) {
      console.log('Minting athlete NFT...');
      const athleteNFT = await sdk.hts.mintNFT({
        collectionId: athleteCollection.collectionId,
        metadata: {
          name: 'Legendary Basketball Star #001',
          description: 'A rare legendary athlete card featuring exceptional stats',
          image: 'https://assets.coinfantasy.com/athletes/basketball/001.jpg',
          attributes: [
            { trait_type: 'Sport', value: 'Basketball' },
            { trait_type: 'Rarity', value: 'Legendary' },
            { trait_type: 'Position', value: 'Point Guard' },
            { trait_type: 'Season', value: '2024' },
            { trait_type: 'Team', value: 'Lakers' },
            { trait_type: 'Overall Rating', value: '98' },
            { trait_type: 'Speed', value: '92' },
            { trait_type: 'Shooting', value: '95' },
            { trait_type: 'Defense', value: '88' }
          ],
          external_url: 'https://coinfantasy.com/athletes/001'
        },
        recipientId: parseInt(account.accountId.replace('0.0.', ''))
      });
      
      console.log('Athlete NFT minted:', athleteNFT);
    }

    // Mint an achievement badge
    if (badgeCollection.collectionId) {
      console.log('Minting achievement badge...');
      const badgeNFT = await sdk.hts.mintNFT({
        collectionId: badgeCollection.collectionId,
        metadata: {
          name: 'First Victory Badge',
          description: 'Awarded for winning your first fantasy league match',
          image: 'https://assets.coinfantasy.com/badges/first-victory.svg',
          attributes: [
            { trait_type: 'Achievement Type', value: 'Victory' },
            { trait_type: 'Rarity', value: 'Common' },
            { trait_type: 'Category', value: 'Milestone' },
            { trait_type: 'Points Value', value: '100' }
          ],
          external_url: 'https://coinfantasy.com/achievements/first-victory'
        },
        recipientId: parseInt(account.accountId.replace('0.0.', ''))
      });
      
      console.log('Achievement badge minted:', badgeNFT);
    }

    // Check token association for NFT collection
    if (athleteCollection.collectionId) {
      console.log('Checking collection token association...');
      const associationInfo = await sdk.hts.checkTokenAssociation(
        account.accountId, 
        athleteCollection.collectionId
      );
      console.log('Collection association status:', associationInfo);
    }

    console.log('NFT collection example completed successfully!');

  } catch (error) {
    console.error('Error in NFT collection example:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the example
if (require.main === module) {
  nftCollectionExample().catch(console.error);
}

export { nftCollectionExample };