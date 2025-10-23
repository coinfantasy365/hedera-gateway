# Contributing to CoinFantasy Hedera SDK

We welcome contributions to the CoinFantasy Hedera SDK! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/hedera-sdk.git
   cd hedera-sdk
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Set up your development environment:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your Hedera testnet credentials
   ```

## Development Workflow

### Available Scripts

- `npm run build` - Build the SDK for production
- `npm run dev` - Watch mode for development
- `npm run test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run docs` - Generate documentation

### Project Structure

```
src/
├── index.ts          # Main SDK export
├── types.ts          # TypeScript type definitions
├── client.ts         # HTTP client with retry logic
├── hcs.ts           # Hedera Consensus Service manager
├── hts.ts           # Hedera Token Service manager
└── wallet.ts        # Wallet connection manager

test/
├── setup.ts         # Jest test setup
└── *.test.ts        # Test files

examples/
├── basic-events.ts        # HCS event publishing
├── token-operations.ts    # HTS token management
├── nft-collection.ts      # NFT creation and minting
├── wallet-connection.ts   # Wallet integration
└── react-integration.tsx # React integration
```

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide comprehensive type definitions
- Avoid `any` types - use proper type definitions
- Use meaningful interface names with descriptive properties
- Document complex types with JSDoc comments

### Code Style

- Use ESLint configuration provided in the project
- Use meaningful variable and function names
- Write self-documenting code with clear intent
- Add JSDoc comments for public APIs
- Use async/await instead of raw Promises
- Handle errors appropriately with custom error types

### Example Code Style

```typescript
/**
 * Publishes an event to Hedera Consensus Service
 * @param eventData - The event data to publish
 * @returns Promise containing the operation result
 * @throws {HederaError} When HCS operation fails
 * @throws {APIError} When API request fails
 */
async publishEvent(eventData: HCSEventData): Promise<HCSPublishResult> {
  try {
    const response = await this.client.post('/hedera/hcs/publish', eventData);
    return {
      operationId: response.operationId,
      transactionId: response.transactionId,
      consensusTimestamp: response.consensusTimestamp
    };
  } catch (error) {
    throw new HederaError(`Failed to publish event: ${error.message}`);
  }
}
```

## Testing

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names that explain the behavior
- Test both success and failure scenarios
- Mock external dependencies (Hedera SDK, HTTP calls)
- Achieve good test coverage (aim for >80%)

### Test Structure

```typescript
describe('HCSManager', () => {
  let manager: HCSManager;
  
  beforeEach(() => {
    manager = new HCSManager(mockClient);
  });

  describe('publishEvent', () => {
    it('should publish event successfully', async () => {
      const eventData = {
        eventType: 'USER_ACTION',
        data: { userId: '123', action: 'test' }
      };

      const result = await manager.publishEvent(eventData);
      
      expect(result).toHaveProperty('operationId');
      expect(result.operationId).toMatch(/^op_/);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.post.mockRejectedValue(new Error('Network error'));

      await expect(
        manager.publishEvent(validEventData)
      ).rejects.toThrow('Failed to publish event');
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Documentation

### JSDoc Comments

All public APIs should have comprehensive JSDoc comments:

```typescript
/**
 * Creates a new NFT collection with royalty configuration
 * 
 * @param collectionInfo - Collection metadata and configuration
 * @param collectionInfo.name - Human-readable collection name
 * @param collectionInfo.symbol - Short symbol for the collection
 * @param collectionInfo.maxSupply - Maximum number of NFTs in collection
 * @param collectionInfo.royaltyFeeSchedule - Royalty configuration for secondary sales
 * 
 * @returns Promise resolving to collection creation result
 * 
 * @throws {HederaError} When collection creation fails on Hedera network
 * @throws {APIError} When API request fails or returns invalid response
 * 
 * @example
 * ```typescript
 * const collection = await sdk.hts.createNFTCollection({
 *   name: 'CoinFantasy Athletes',
 *   symbol: 'CFA',
 *   maxSupply: 10000,
 *   royaltyFeeSchedule: [{
 *     numerator: 5,
 *     denominator: 100,
 *     feeCollectorAccountId: '0.0.123456'
 *   }]
 * });
 * ```
 */
```

### README Updates

When adding new features, update the README.md with:
- API documentation
- Code examples
- Configuration options
- Error handling guidance

## Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm test`
2. Ensure code follows style guidelines: `npm run lint`
3. Update documentation for any new features
4. Add or update tests for your changes
5. Update CHANGELOG.md with your changes

### PR Template

Use this template for your pull request:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation made
- [ ] Changes generate no new warnings
- [ ] Tests added that prove the fix is effective or feature works
- [ ] New and existing unit tests pass locally
```

### Review Process

1. All PRs require at least one review from a maintainer
2. All automated checks must pass
3. PRs should be focused on a single feature or fix
4. Breaking changes require special consideration and documentation

## Release Process

### Version Management

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Steps

1. Update version in `package.json`
2. Update CHANGELOG.md with release notes
3. Create a GitHub release with appropriate tag
4. CI/CD pipeline automatically publishes to NPM

### Pre-release Testing

Before major releases:
1. Test with example applications
2. Verify documentation accuracy
3. Run security audit: `npm audit`
4. Test build process: `npm run build`

## Getting Help

- Open an issue for bugs or feature requests
- Join our Discord community for discussions
- Check existing issues and PRs before creating new ones
- Tag maintainers for urgent issues

## Recognition

Contributors will be:
- Listed in CHANGELOG.md for their contributions
- Mentioned in release notes for significant contributions
- Invited to join the maintainer team for consistent contributors

Thank you for contributing to CoinFantasy Hedera SDK! 🚀