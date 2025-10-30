import { WalletConnectionInfo } from './types.js';
import type { WalletAdapter } from './wallet/WalletAdapter.js';
import { WalletConnectAdapter, WalletConnectOptions } from './wallet/WalletConnectAdapter.js';
import { HashConnectAdapter } from './wallet/HashConnectAdapter.js';

/**
 * WalletManager delegates wallet operations to an injected adapter.
 * If no adapter is provided, it will prefer HashConnectAdapter when available.
 */
export class WalletManager {
  private connectionInfo: WalletConnectionInfo | null = null;
  private adapter: WalletAdapter;

  constructor(adapter?: WalletAdapter) {
    if (adapter) {
      this.adapter = adapter;
    } else {
      // default to WalletConnectAdapter (migration away from HashConnect)
      // If a WALLETCONNECT_PROJECT_ID env var is present we use it automatically.
      const envProjectId = (typeof process !== 'undefined' && process.env && process.env.WALLETCONNECT_PROJECT_ID) as unknown as string | undefined;
      if (envProjectId) {
        const opts: WalletConnectOptions = { projectId: envProjectId };
        this.adapter = new WalletConnectAdapter(opts);
      } else {
        // lightweight unavailable stub to avoid throwing during import/construct
        this.adapter = {
          isAvailable: () => false,
          connect: async () => { throw new Error('No wallet adapter configured'); },
          disconnect: async () => {},
          requestTransaction: async () => { throw new Error('No wallet adapter configured'); },
        } as WalletAdapter;
      }
    }
  }

  /** Inject a different adapter at runtime */
  setAdapter(adapter: WalletAdapter) {
    this.adapter = adapter;
  }

  async init(): Promise<void> {
    if (this.adapter.init) await this.adapter.init();
    // attempt to restore persisted connection
    this.restoreConnection();
  }

  async connect(): Promise<WalletConnectionInfo> {
    if (!this.adapter.isAvailable()) {
      throw new Error('No wallet provider available for the configured adapter');
    }

    const info = await this.adapter.connect();
    this.connectionInfo = info;
    return info;
  }

  /**
   * Backwards-compatible alias for HashPack-style connect used by older callers/tests
   */
  async connectHashPack(): Promise<WalletConnectionInfo> {
    return this.connect();
  }

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
    this.connectionInfo = null;
  }

  /**
   * Backwards-compatible helper that specifically checks for HashPack availability
   * If the configured adapter is a HashConnectAdapter this returns its availability,
   * otherwise it attempts to detect the legacy `window.hashpack` global.
   */
  isHashPackAvailable(): boolean {
    try {
      // attempt to detect hashpack global first
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).hashpack) return true;
    } catch {
      // ignore
    }
    // Fall back to adapter availability
    return !!this.adapter && typeof this.adapter.isAvailable === 'function' && this.adapter.isAvailable();
  }

  getConnectionInfo(): WalletConnectionInfo | null {
    return this.connectionInfo;
  }

  isConnected(): boolean {
    return this.connectionInfo !== null;
  }

  restoreConnection(): WalletConnectionInfo | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('hedera_wallet_connection');
      if (stored) {
        this.connectionInfo = JSON.parse(stored);
        return this.connectionInfo;
      }
    } catch (error) {
      console.warn('Failed to restore wallet connection:', error);
      localStorage.removeItem('hedera_wallet_connection');
    }

    return null;
  }

  async requestTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    if (!this.isConnected()) throw new Error('Wallet not connected');
    return await this.adapter.requestTransaction(transaction);
  }

  getAccountId(): string | null {
    return this.connectionInfo?.accountId || null;
  }

  getNetwork(): string | null {
    return this.connectionInfo?.network || null;
  }

  static isValidAccountId(accountId: string): boolean {
    const pattern = /^0\.0\.\d+$/;
    return pattern.test(accountId);
  }

  static formatAccountId(accountId: string): string {
    if (!accountId || accountId.length <= 12) return accountId;
    return `${accountId.slice(0, 6)}...${accountId.slice(-6)}`;
  }

  static getHashScanAccountUrl(accountId: string, network: string = 'testnet'): string {
    const baseUrl = network === 'mainnet'
      ? 'https://hashscan.io/mainnet'
      : 'https://hashscan.io/testnet';
    return `${baseUrl}/account/${accountId}`;
  }

  static getHashScanTransactionUrl(transactionId: string, network: string = 'testnet'): string {
    const baseUrl = network === 'mainnet'
      ? 'https://hashscan.io/mainnet'
      : 'https://hashscan.io/testnet';
    return `${baseUrl}/transaction/${transactionId}`;
  }
}

export type WalletChoice = 'hashpack' | 'walletconnect';

export function createAdapterForChoice(choice: WalletChoice, opts?: WalletConnectOptions) {
  if (choice === 'hashpack') return new HashConnectAdapter();
  if (choice === 'walletconnect') {
    if (!opts) throw new Error('WalletConnect requires options with projectId');
    return new WalletConnectAdapter(opts);
  }
  throw new Error('Unknown wallet choice');
}