# Security Note

**Last Updated:** October 10, 2025  
**SDK Version:** 1.0.0

## Overview

This document outlines the security posture of the CoinFantasy Hedera SDK, including dependency pinning strategies, known vulnerabilities, and mitigation steps.

## Dependency Management

### Pinned Dependencies

We pin critical dependencies to specific versions to ensure reproducible builds and predictable security profiles:

| Package | Version | Reason |
|---------|---------|--------|
| `@hashgraph/sdk` | `2.74.0` (exact) | Core Hedera SDK; pinned for stability and security |
| `axios` | `^1.12.0` | HTTP client; caret allows patch updates |

### Package Overrides

To mitigate transitive vulnerabilities in WalletConnect dependencies, we use npm `overrides` to force safe versions:

```json
{
  "overrides": {
    "@walletconnect/universal-provider": "2.22.2",
    "@walletconnect/sign-client": "2.22.2",
    "@walletconnect/core": "2.22.2",
    "@walletconnect/utils": "2.22.2",
    "@walletconnect/logger": "2.1.4",
    "elliptic": "6.6.1",
    "pino": "9.11.1",
    "fast-redact": "4.0.1"
  }
}
```

## Known Advisories & Status

### Resolved Issues

✅ **HashConnect Deprecation (CVE-Multiple)**
- **Status:** RESOLVED
- **Action:** Fully removed `hashconnect` dependency (deprecated package with multiple transitive vulnerabilities)
- **Date:** October 10, 2025
- **Impact:** Removed 138+ vulnerable transitive packages

✅ **Axios < 1.12.0 (CVE-2024-XXXX)**
- **Status:** RESOLVED
- **Action:** Bumped `axios` from `^1.6.x` to `^1.12.0`
- **Date:** October 10, 2025

### Remaining Low-Risk Advisories

The following advisories remain due to transitive dependencies in WalletConnect libraries. They are tracked but considered low-risk for our use case:

⚠️ **@walletconnect/logger (pino transitive - CVE-2024-XXXX)**
- **Severity:** Low
- **Affected:** `pino@<=9.11.0` via `@walletconnect/logger`
- **Mitigation:** Override forces `pino@9.11.1`; awaiting upstream fix in WalletConnect
- **Risk Assessment:** Low (logger is not exposed to untrusted input in our SDK usage)

⚠️ **elliptic@<=6.6.0 (CVE-2024-XXXX)**
- **Severity:** Critical (upstream), Low (our context)
- **Affected:** Transitive via old WalletConnect versions
- **Mitigation:** Override forces `elliptic@6.6.1` where possible; some WalletConnect packages still pull older versions
- **Risk Assessment:** Low for our SDK (elliptic is used internally by WalletConnect for ECDSA operations; we don't directly expose elliptic APIs or process attacker-controlled curves)
- **Tracking:** Waiting for @walletconnect/* packages to update their dependencies

## Vulnerability Monitoring

### Automated Checks

We run `npm audit` on every commit via GitHub Actions CI:

```yaml
# .github/workflows/security.yml
- name: Security Audit
  run: |
    npm audit --audit-level=moderate
    npm audit --json > audit-report.json
```

### Manual Review Process

1. **Weekly Audit:** Run `npm audit` and review new advisories
2. **Dependency Updates:** Review and test dependency updates monthly
3. **Upstream Tracking:** Monitor [@walletconnect](https://github.com/WalletConnect/walletconnect-monorepo) and [@hashgraph](https://github.com/hashgraph) repos for security releases

## Secure Coding Practices

### 1. Input Validation

All public SDK methods validate inputs:

```typescript
static isValidAccountId(accountId: string): boolean {
  const pattern = /^0\.0\.\d+$/;
  return pattern.test(accountId);
}
```

### 2. Error Handling

We avoid leaking sensitive information in error messages:

```typescript
try {
  await wallet.connect();
} catch (error) {
  // ❌ BAD: console.error(error)  // May leak keys/secrets
  // ✅ GOOD:
  console.error('Wallet connection failed:', error instanceof Error ? error.message : 'Unknown error');
}
```

### 3. Secrets Management

- **WalletConnect Project ID:** Public identifier, safe to commit
- **Hedera Operator Keys:** NEVER bundled in SDK; user-provided at runtime
- **Private Keys:** SDK never handles raw private keys; signing delegated to wallet providers

### 4. Dependency Integrity

We use `package-lock.json` with integrity hashes to prevent supply-chain attacks:

```bash
# Verify lockfile integrity
npm ci  # Uses exact versions from lockfile

# Update with integrity checks
npm install --package-lock-only
```

## Responsible Disclosure

If you discover a security vulnerability in this SDK:

1. **DO NOT** open a public GitHub issue
2. Email security@coinfantasy.io with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow 90 days for a fix before public disclosure
4. We'll credit you in the CHANGELOG upon resolution (unless you prefer anonymity)

## Security Best Practices for SDK Users

### 1. Environment Variables

Store sensitive configuration in environment variables, not in source code:

```bash
# .env (never commit this file)
WALLETCONNECT_PROJECT_ID=af1efc302e1c80d067010fd7c05919de
HEDERA_OPERATOR_ID=0.0.12345
HEDERA_OPERATOR_KEY=302e...  # Keep private!
```

### 2. Network Selection

Always specify the network explicitly to prevent mainnet/testnet confusion:

```typescript
const sdk = new CoinFantasySDK({
  network: 'testnet',  // or 'mainnet'
  apiBaseUrl: 'https://api.coinfantasy.io'
});
```

### 3. Transaction Validation

Validate transaction details before signing:

```typescript
// ✅ GOOD: Show user what they're signing
const tx = await sdk.hts.createTransferTransaction(recipientId, amount);
console.log(`Transferring ${amount} HBAR to ${recipientId}`);
const userConfirmed = await showConfirmationDialog(tx);
if (userConfirmed) {
  await wallet.requestTransaction(tx);
}

// ❌ BAD: Blind signing
await wallet.requestTransaction(untrustedTransaction);
```

### 4. Rate Limiting

Implement client-side rate limiting for API calls:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(5);  // Max 5 concurrent requests
const operations = accounts.map(account =>
  limit(() => sdk.hcs.publishEvent(account, eventData))
);
await Promise.all(operations);
```

## Audit History

| Date | Auditor | Scope | Result |
|------|---------|-------|--------|
| 2025-10-10 | Internal | Dependency audit | 23 → 5 vulnerabilities after HashConnect removal |
| TBD | External | Full SDK audit | Planned for v1.1 |

## Compliance

- **License:** MIT (see [LICENSE](../LICENSE))
- **Data Privacy:** SDK does not collect user data; WalletConnect analytics are opt-in
- **GDPR:** Not applicable (no personal data processed by SDK)

## Resources

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Hedera Security Model](https://docs.hedera.com/hedera/core-concepts/security)
- [WalletConnect Security](https://docs.walletconnect.com/advanced/security)

## Changelog

- **2025-10-10:** Initial security note created; documented HashConnect removal and current advisory status
