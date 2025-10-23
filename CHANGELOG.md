# Changelog

All notable changes to the CoinFantasy Hedera SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- Initial release of CoinFantasy Hedera SDK
- **HCS Manager**: Publish and manage Hedera Consensus Service events
  - Event publishing with type validation
  - Operation status tracking
  - Mirror node integration for verification
- **HTS Manager**: Complete token and NFT management
  - Reward token distribution with metadata
  - Token association checking and management
  - NFT collection creation with royalty support
  - Token balance queries
- **Wallet Manager**: HashPack wallet integration
  - Connection management with persistence
  - Account validation and formatting utilities
  - HashScan URL generation for blockchain exploration
  - Disconnect functionality
- **Type Safety**: Comprehensive TypeScript definitions
  - Full type coverage for all SDK operations
  - Proper error type definitions
  - Interface documentation
- **Error Handling**: Robust error management
  - Custom error classes for different failure types
  - Retry logic with exponential backoff
  - Graceful degradation
- **Build System**: Modern packaging and distribution
  - CommonJS and ESM module support
  - TypeScript declaration files
  - Rollup-based build pipeline
- **Documentation**: Complete developer resources
  - Comprehensive README with examples
  - API reference documentation
  - Integration guides for React and Node.js
- **Testing**: Test suite with mocking
  - Jest configuration with TypeScript support
  - Mock implementations for HashPack wallet
  - Coverage reporting
- **CI/CD**: Complete automation pipeline
  - GitHub Actions workflow
  - Automated testing and linting
  - Security auditing
  - NPM publishing automation

### Technical Details
- Built with TypeScript 5.3+
- Supports Node.js 18+
- Uses Axios for HTTP client with retry logic
- Integrates with @hashgraph/sdk for Hedera operations
- HashConnect peer dependency for wallet connectivity

### Development Tools
- ESLint configuration for code quality
- Jest testing framework with mocks
- TypeDoc for documentation generation
- Rollup for optimized bundling
- GitHub Actions for CI/CD automation

## [Unreleased]

### Planned Features
- Enhanced NFT marketplace utilities
- Smart contract integration helpers
- Advanced event filtering and querying
- Batch operation support
- WebSocket real-time event streaming
- React Native compatibility
- Performance monitoring hooks