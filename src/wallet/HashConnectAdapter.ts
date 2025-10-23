import type { WalletAdapter } from './WalletAdapter.js';
import type { WalletConnectionInfo } from '../types.js';

declare global {
  interface Window {
    hashpack?: {
      connectToLocalWallet: () => Promise<{ accountIds: string[]; network?: string; publicKey?: string }>;
      disconnect?: () => void;
      requestTransaction?: (transaction: Uint8Array) => Promise<Uint8Array>;
    };
  }
}

export class HashConnectAdapter implements WalletAdapter {
  isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!(window as any).hashpack;
    } catch (err) {
      return false;
    }
  }

  // Poll for up to timeoutMs milliseconds for window.hashpack to appear
  async waitForHashPack(timeoutMs = 10000): Promise<any | null> {
    if (typeof window === 'undefined') return null;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hp = (window as any).hashpack;
      if (hp) return hp;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, 250));
    }
    return null;
  }

  // Probe common candidate connect methods on the hashpack object without invoking them
  probeConnectMethod(hp: any): string | null {
    if (!hp) return null;
    const candidates = ['connectToLocalWallet', 'connect', 'connectWallet', 'connectToWallet'];
    for (const name of candidates) {
      if (typeof hp[name] === 'function') return name;
    }
    // also check non-enumerable and symbol keys
    try {
      const keys = Reflect.ownKeys(hp || {});
      for (const k of keys) {
        try {
          if (typeof (hp as any)[k] === 'function') return String(k);
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  async init(): Promise<void> {
    // no-op for hashpack; kept for interface compatibility
    return;
  }

  async connect(): Promise<WalletConnectionInfo> {
    // Wait for HashPack to be injected (up to 10s)
    const hp = await this.waitForHashPack(10000);
    if (!hp) throw new Error('HashPack wallet not available (no injection detected)');

    const method = this.probeConnectMethod(hp);
    if (!method || typeof hp[method] !== 'function') {
      throw new Error('HashPack connect API not available on window.hashpack');
    }

    // call the discovered method
    const result = await hp[method]();

    // Dev-only: surface the raw connect result to help debugging network reporting
    try {
      // eslint-disable-next-line no-console
      if (process && process.env && process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('HashConnectAdapter: raw connect result', result);
        // eslint-disable-next-line no-console
        console.log('HashConnectAdapter: reported network', result && result.network);
      }
    } catch (e) {
      // ignore logging errors in non-node-like environments
    }

    if (!result.accountIds || result.accountIds.length === 0) {
      throw new Error('No accounts returned by HashPack');
    }

    const info: WalletConnectionInfo = {
      accountId: result.accountIds[0],
      network: result.network || 'testnet',
      publicKey: result.publicKey,
    };

    // persist minimal connection info
    if (typeof window !== 'undefined') {
      localStorage.setItem('hedera_wallet_connection', JSON.stringify(info));
    }

    return info;
  }

  async disconnect(): Promise<void> {
    try {
      const hp = (typeof window !== 'undefined') ? (window as any).hashpack : null;
      if (hp && typeof hp.disconnect === 'function') {
        hp.disconnect();
      }
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hedera_wallet_connection');
    }
  }

  async requestTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    if (!this.isAvailable() || !window.hashpack?.requestTransaction) {
      throw new Error('HashPack transaction request API not available');
    }

    return await window.hashpack.requestTransaction(transaction);
  }

  async getAccounts(): Promise<string[]> {
    // Attempt to wait briefly for injection and probe connect method
    const hp = await this.waitForHashPack(3000);
    if (!hp) return [];
    const method = this.probeConnectMethod(hp);
    if (!method || typeof hp[method] !== 'function') return [];
    try {
      const result = await hp[method]();
      return result?.accountIds || [];
    } catch (err) {
      return [];
    }
  }
}
