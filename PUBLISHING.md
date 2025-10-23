# Publishing Guide

This guide covers how to publish the `@coinfantasy/hedera-sdk` package to npm as an open-source project.

## Prerequisites

1. **npm Account**
   - Create account at [npmjs.com](https://www.npmjs.com/signup)
   - Verify email address

2. **npm CLI Authentication**
   ```bash
   npm login
   # Enter your npm credentials
   ```

3. **Organization (Optional)**
   - Create `@coinfantasy` org on npm: https://www.npmjs.com/org/create
   - Add team members with publish permissions

## Pre-Publication Checklist

### 1. Version Management

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

Update version in `package.json`:

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag (e.g., `v1.0.1`)

### 2. Build & Test

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Check for type errors
npx tsc --noEmit
```

### 3. Security Audit

```bash
# Run audit
npm audit

# Fix auto-fixable issues
npm audit fix

# Review remaining advisories
npm audit --json > audit-report.json
```

### 4. Documentation

Ensure these files are up to date:

- ✅ `README.md` - Installation, usage, examples
- ✅ `CHANGELOG.md` - Version history
- ✅ `LICENSE` - MIT license file
- ✅ `docs/migration.md` - Migration guide
- ✅ `SECURITY_NOTE.md` - Security disclosures
- ✅ `docs/api-reference.md` - API documentation

### 5. Package Metadata

Verify `package.json` metadata:

```json
{
  "name": "@coinfantasy/hedera-sdk",
  "version": "1.0.0",
  "description": "TypeScript/JavaScript SDK for CoinFantasy's Hedera blockchain integration",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "SECURITY_NOTE.md",
    "docs"
  ],
  "keywords": [
    "hedera",
    "blockchain",
    "hcs",
    "hts",
    "coinfantasy",
    "fantasy-sports",
    "typescript",
    "sdk",
    "hashpack",
    "walletconnect"
  ],
  "author": "CoinFantasy Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/coinfantasy365/hedera-sdk.git"
  },
  "bugs": {
    "url": "https://github.com/coinfantasy365/hedera-sdk/issues"
  },
  "homepage": "https://github.com/coinfantasy365/hedera-sdk#readme"
}
```

### 6. Test Package Contents

```bash
# Dry-run publish to see what will be included
npm publish --dry-run

# Create tarball for inspection
npm pack

# Inspect tarball contents
tar -tzf coinfantasy-hedera-sdk-1.0.0.tgz
```

## Publishing

### First-Time Setup

#### Option A: Public Package (Recommended for Open Source)

```bash
# Publish as public (free)
npm publish --access public
```

#### Option B: Scoped Private Package (Requires npm Pro)

```bash
# Publish as private (requires paid npm account)
npm publish --access restricted
```

### Publish Workflow

```bash
# 1. Ensure you're on main branch with clean working directory
git checkout main
git pull origin main
git status  # Should show "nothing to commit, working tree clean"

# 2. Run pre-publish checks
npm run build
npm test
npm run lint
npm audit

# 3. Bump version (creates commit + tag)
npm version patch -m "Release v%s"

# 4. Publish to npm
npm publish --access public

# 5. Push commits and tags to GitHub
git push origin main --tags

# 6. Create GitHub Release
# Go to https://github.com/coinfantasy365/hedera-sdk/releases/new
# - Tag: v1.0.1
# - Title: "Release v1.0.1"
# - Description: Copy from CHANGELOG.md
# - Attach tarball: coinfantasy-hedera-sdk-1.0.1.tgz
```

### Automated Publishing with GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test
      
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Setup npm token:**
1. Generate token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add as GitHub secret: Settings → Secrets → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: `npm_...` (your token)

## Post-Publication

### 1. Verify Publication

```bash
# Check package on npm
npm view @coinfantasy/hedera-sdk

# Test installation
mkdir test-install && cd test-install
npm init -y
npm install @coinfantasy/hedera-sdk
node -e "const sdk = require('@coinfantasy/hedera-sdk'); console.log(sdk)"
```

### 2. Update Documentation Sites

- Update [docs.coinfantasy.io](https://docs.coinfantasy.io) with new version
- Announce on:
  - GitHub Discussions
  - Twitter/X
  - Hedera Discord
  - Dev.to / Medium

### 3. Create Release Notes

GitHub Release template:

```markdown
## What's New in v1.0.0

### 🚀 Features
- Migrated from HashConnect to WalletConnect v2
- Added adapter pattern for wallet providers
- HashPack support via browser extension
- Lazy-loading of WalletConnect dependencies

### 🔒 Security
- Removed deprecated HashConnect (138+ vulnerable packages removed)
- Pinned @hashgraph/sdk to 2.74.0
- Added package overrides for WalletConnect vulnerabilities

### 📚 Documentation
- [Migration Guide](./docs/migration.md)
- [Security Note](./SECURITY_NOTE.md)
- [API Reference](./docs/api-reference.md)

### 💥 Breaking Changes
- HashConnect dependency removed
- New adapter pattern required for wallet initialization
- See [Migration Guide](./docs/migration.md) for upgrade steps

**Full Changelog**: https://github.com/coinfantasy365/hedera-sdk/compare/v0.9.0...v1.0.0

## Installation

\`\`\`bash
npm install @coinfantasy/hedera-sdk@^1.0.0
\`\`\`

## Quick Start

\`\`\`typescript
import { WalletManager, createAdapterForChoice } from '@coinfantasy/hedera-sdk';

const adapter = createAdapterForChoice('hashpack');
const wallet = new WalletManager(adapter);
await wallet.init();
await wallet.connect();
\`\`\`

See [README](./README.md) for full documentation.
```

## Unpublishing (Emergency Only)

**⚠️ CAUTION:** Unpublishing is discouraged and only allowed within 72 hours of publication.

```bash
# Unpublish a specific version
npm unpublish @coinfantasy/hedera-sdk@1.0.0

# Deprecate instead (recommended)
npm deprecate @coinfantasy/hedera-sdk@1.0.0 "Critical security issue, use @1.0.1"
```

**Better alternatives:**
1. Publish a patch version with the fix
2. Use `npm deprecate` to warn users
3. Update README with security advisory

## Version Management Strategy

### Release Cadence

- **Patch releases:** As needed (bug fixes, security updates)
- **Minor releases:** Monthly (new features)
- **Major releases:** Quarterly or when breaking changes required

### Branch Strategy

```bash
main           # Production-ready code, tagged releases
├── develop    # Integration branch for next release
├── feature/*  # Feature branches
└── hotfix/*   # Urgent production fixes
```

### Pre-release Versions

```bash
# Alpha (early testing)
npm version prerelease --preid=alpha
# 1.0.0 → 1.0.1-alpha.0

# Beta (feature-complete, testing)
npm version prerelease --preid=beta
# 1.0.0 → 1.0.1-beta.0

# Release candidate
npm version prerelease --preid=rc
# 1.0.0 → 1.0.1-rc.0

# Publish pre-release
npm publish --tag beta --access public
```

Users can install pre-releases:
```bash
npm install @coinfantasy/hedera-sdk@beta
```

## Package Distribution Tags

```bash
# Set latest tag (default)
npm dist-tag add @coinfantasy/hedera-sdk@1.0.0 latest

# Set next tag (for pre-releases)
npm dist-tag add @coinfantasy/hedera-sdk@2.0.0-beta.0 next

# List all tags
npm dist-tag ls @coinfantasy/hedera-sdk
```

## License Compliance

This SDK is licensed under **MIT License**, which means:

✅ Users can:
- Use commercially
- Modify
- Distribute
- Sublicense

❌ Users must:
- Include original license and copyright notice
- Cannot hold us liable

Ensure `LICENSE` file is included in published package.

## Support & Maintenance

- **GitHub Issues:** https://github.com/coinfantasy365/hedera-sdk/issues
- **Discussions:** https://github.com/coinfantasy365/hedera-sdk/discussions
- **Security:** security@coinfantasy.io
- **npm Package:** https://www.npmjs.com/package/@coinfantasy/hedera-sdk

## Metrics & Analytics

Track adoption via:
- npm download stats: `npm info @coinfantasy/hedera-sdk`
- GitHub stars/forks
- npm-stat.com

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Open Source Guides](https://opensource.guide/)

---

**Last Updated:** October 10, 2025  
**Maintainers:** CoinFantasy Team  
**Package:** [@coinfantasy/hedera-sdk](https://www.npmjs.com/package/@coinfantasy/hedera-sdk)
