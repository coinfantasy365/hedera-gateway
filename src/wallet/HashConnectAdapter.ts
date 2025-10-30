import type { WalletAdapter } from './WalletAdapter.js';
import type { WalletConnectionInfo } from '../types.js';

interface HashPackConnectResult {
  accountIds: string[];
  network?: string;
  publicKey?: string;
}

declare global {
  interface Window {
    hashpack?: Record<string, unknown>;
  }
}

export class HashConnectAdapter implements WalletAdapter {
  isAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).hashpack;
    } catch {
      return false;
    }
  }

  // Poll for up to timeoutMs milliseconds for window.hashpack to appear
  async waitForHashPack(timeoutMs = 10000): Promise<unknown | null> {
    if (typeof window === 'undefined') return null;
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const hp = (window as unknown as Record<string, unknown>).hashpack;
      if (hp) return hp;
       
      await new Promise(res => setTimeout(res, 250));
    }
    return null;
  }

  // Probe common candidate connect methods on the hashpack object without invoking them
  probeConnectMethod(hp: unknown): string | null {
    if (!hp) return null;
    const candidates = ['connectToLocalWallet', 'connect', 'connectWallet', 'connectToWallet'];
    for (const name of candidates) {
      if (typeof (hp as Record<string, unknown>)[name] === 'function') return name;
    }
    // also check non-enumerable and symbol keys
    try {
      const keys = Reflect.ownKeys(hp || {});
      for (const k of keys) {
        try {
          const key = typeof k === 'symbol' ? k.toString() : k;
          if (typeof (hp as Record<string | symbol, unknown>)[k] === 'function') return key;
        } catch {
          // ignore
        }
      }
    } catch {
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
    const hpRecord = hp as Record<string, unknown>;
    if (!method || typeof hpRecord[method] !== 'function') {
      throw new Error('HashPack connect API not available on window.hashpack');
    }

    // call the discovered method
    const result = await (hpRecord[method] as () => Promise<HashPackConnectResult>)();

    // Dev-only: surface the raw connect result to help debugging network reporting
    try {
       
      if (process && process.env && process.env.NODE_ENV === 'development') {
         
        console.log('HashConnectAdapter: raw connect result', result);
         
        console.log('HashConnectAdapter: reported network', result && result.network);
      }
    } catch {
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
      const hp = (typeof window !== 'undefined') ? (window as unknown as Record<string, unknown>).hashpack as Record<string, unknown> : null;
      if (hp && typeof hp.disconnect === 'function') {
        (hp.disconnect as () => void)();
      }
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hedera_wallet_connection');
    }
  }

  async requestTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    if (!this.isAvailable() || !window.hashpack) {
      throw new Error('HashPack wallet not available');
    }
    const requestTransaction = (window.hashpack as Record<string, unknown>).requestTransaction as
      | ((transaction: Uint8Array) => Promise<Uint8Array>)
      | undefined;
    if (!requestTransaction) {
      throw new Error('HashPack requestTransaction not available');
    }
    return await requestTransaction(transaction);
  }

  async getAccounts(): Promise<string[]> {
    // Attempt to wait briefly for injection and probe connect method
    const hp = await this.waitForHashPack(3000);
    if (!hp) return [];
    const method = this.probeConnectMethod(hp);
    const hpRecord = hp as Record<string, unknown>;
    if (!method || typeof hpRecord[method] !== 'function') return [];
    try {
      const result = await (hpRecord[method] as () => Promise<HashPackConnectResult>)();
      return result?.accountIds || [];
    } catch {
      return [];
    }
  }
}
