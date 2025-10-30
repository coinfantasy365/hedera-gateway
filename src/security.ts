/**
 * Security utilities for input validation and sanitization
 */

/**
 * Validate Hedera account ID format
 */
export function isValidAccountId(accountId: string): boolean {
  if (!accountId || typeof accountId !== 'string') return false;
  const pattern = /^0\.0\.\d+$/;
  return pattern.test(accountId);
}

/**
 * Validate Hedera token ID format
 */
export function isValidTokenId(tokenId: string): boolean {
  if (!tokenId || typeof tokenId !== 'string') return false;
  const pattern = /^0\.0\.\d+$/;
  return pattern.test(tokenId);
}

/**
 * Validate Hedera topic ID format
 */
export function isValidTopicId(topicId: string): boolean {
  if (!topicId || typeof topicId !== 'string') return false;
  const pattern = /^0\.0\.\d+$/;
  return pattern.test(topicId);
}

/**
 * Validate network type
 */
export function isValidNetwork(network: string): network is 'testnet' | 'mainnet' {
  return network === 'testnet' || network === 'mainnet';
}

/**
 * Sanitize event data to prevent injection attacks
 */
export function sanitizeEventData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Remove null bytes and control characters from strings
    if (typeof value === 'string') {
      sanitized[key] = value.replace(/[\x00-\x1F\x7F]/g, '');
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeEventData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize amount (must be positive number)
 */
export function validateAmount(amount: number): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('Amount must be a valid number');
  }
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  if (amount > Number.MAX_SAFE_INTEGER) {
    throw new Error('Amount exceeds maximum safe integer');
  }
  return amount;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Redact sensitive data from objects for logging
 */
export function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'apiKey', 'api_key', 'apikey',
    'privateKey', 'private_key', 'privatekey',
    'operatorKey', 'operator_key',
    'password', 'secret', 'token',
    'authorization', 'auth'
  ];

  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk));

    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Safe environment variable access with validation
 */
export function getEnvVar(key: string, required: boolean = false): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    if (required) throw new Error(`Environment variable ${key} is required but process.env is not available`);
    return undefined;
  }

  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  
  return value;
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
  }

  reset(): void {
    this.requests = [];
  }
}
