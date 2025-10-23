import type { WalletConnectionInfo } from '../types.js';

/**
 * Minimal wallet adapter interface used by the SDK.
 * Implementations should adapt whatever wallet provider is available.
 */
export interface WalletAdapter {
  /** Initialize the adapter (optional) */
  init?(): Promise<void>;

  /** Return true if the provider is present in the runtime */
  isAvailable(): boolean;

  /** Connect and return a WalletConnectionInfo */
  connect(): Promise<WalletConnectionInfo>;

  /** Disconnect the provider/session */
  disconnect(): Promise<void>;

  /** Request a transaction signing/exec flow */
  requestTransaction(transaction: Uint8Array): Promise<Uint8Array>;

  /** Return available account IDs (optional faster path) */
  getAccounts?(): Promise<string[]>;
}
