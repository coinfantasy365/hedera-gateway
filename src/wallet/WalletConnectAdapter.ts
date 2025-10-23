import type { WalletAdapter } from './WalletAdapter.js';
import type { WalletConnectionInfo } from '../types.js';

/**
 * WalletConnect v2 adapter skeleton.
 * This implementation lazy-loads `@hashgraph/hedera-wallet-connect` (or other providers)
 * so the codebase won't crash at import-time if the package isn't yet installed.
 *
 * TODO: implement proper session handling, pairing, and request/response mapping.
 */
export interface WalletConnectOptions {
  projectId: string;
  name?: string;
  description?: string;
  url?: string;
  icons?: string[];
}

/**
 * Minimal WalletConnect v2 adapter implementation.
 * It lazy-loads the universal provider and Hedera WC connector and exposes
 * a small subset of behaviors used by the SDK. This is intentionally
 * conservative — full session request mapping and detailed signing flows
 * should be implemented and tested against a real wallet.
 */
export class WalletConnectAdapter implements WalletAdapter {
  private provider: any | null = null;
  private connector: any | null = null;
  private opts: WalletConnectOptions;

  constructor(opts: WalletConnectOptions) {
    if (!opts || !opts.projectId) throw new Error('WalletConnectAdapter requires a projectId');
    this.opts = opts;
  }

  isAvailable(): boolean {
    // available once provider is initialized
    return !!this.provider;
  }

  async init(): Promise<void> {
    if (this.provider) return;

    try {
      // Lazy-import libraries so consumers who don't use WalletConnect don't need them
      const upkg = await import('@walletconnect/universal-provider');
      const HederaWc = await import('@hashgraph/hedera-wallet-connect');

      const UniversalProviderCtor: any = (upkg && (upkg.default || upkg)) as any;
      if (!UniversalProviderCtor || typeof UniversalProviderCtor.init !== 'function') {
        throw new Error('UniversalProvider not found or invalid');
      }

      // Create universal provider with the supplied projectId
      this.provider = await UniversalProviderCtor.init({ projectId: this.opts.projectId });

      // Hedera connector may export a default class/factory or named exports.
      try {
        const HederaExport: any = HederaWc && (HederaWc.default || HederaWc);
        const HederaCtor = HederaExport && (HederaExport.HederaWalletConnect || HederaExport);
        if (typeof HederaCtor === 'function') {
          this.connector = new HederaCtor({ provider: this.provider, metadata: {
            name: this.opts.name || 'CoinFantasy',
            description: this.opts.description || 'CoinFantasy DApp',
            url: this.opts.url || 'https://coinfantasy.io',
            icons: this.opts.icons || []
          }});
        } else {
          this.connector = null;
        }
      } catch (err) {
        this.connector = null;
      }
    } catch (err) {
      // keep provider null if imports or initialization failed
      this.provider = null;
      this.connector = null;
    }
  }

  async connect(): Promise<WalletConnectionInfo> {
    if (!this.provider) throw new Error('WalletConnect provider not initialized');

    // Request pairing if not already connected. The UniversalProvider exposes
    // a `connect` method that returns a session with namespaces. We conservatively
    // map the first Hedera account we find to WalletConnectionInfo.
    const session = await this.provider.connect({
      requiredNamespaces: {
        hedera: {
          methods: [
            'hedera_sendTransaction',
            'hedera_getAccounts',
            'hedera_signMessage',
          ],
          chains: ['hedera:testnet'],
          events: [],
        },
      },
      optionalNamespaces: {},
    });

    // session.namespaces.hedera.accounts is an array like ['hedera:testnet:0.0.123']
    const hederaNs = session?.namespaces?.hedera;
    const accountStr = Array.isArray(hederaNs?.accounts) && hederaNs.accounts.length ? hederaNs.accounts[0] : null;

    if (!accountStr) throw new Error('No Hedera account returned from WalletConnect session');

    // parse 'hedera:network:accountId' format
    const parts = accountStr.split(':');
    const network = parts[1] === 'mainnet' ? 'mainnet' : 'testnet';
    const accountId = parts[2];

    const info: WalletConnectionInfo = {
      accountId,
      network,
    };

    // persist minimal info for restore
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hedera_wallet_connection', JSON.stringify(info));
      }
    } catch (err) {
      // ignore storage errors
    }

    return info;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.provider && typeof this.provider.disconnect === 'function') {
        await this.provider.disconnect();
      }
    } catch (err) {
      // swallow
    }

    this.provider = null;
    this.connector = null;
    try {
      if (typeof window !== 'undefined') localStorage.removeItem('hedera_wallet_connection');
    } catch (err) {}
  }

  async requestTransaction(transaction: Uint8Array): Promise<Uint8Array> {
    if (!this.provider) throw new Error('WalletConnect provider not initialized');

    // Hedera WalletConnect expects specific JSON-RPC payloads; full mapping depends
    // on the wallet implementation. We'll attempt to call a generic method if available.
    if (typeof this.provider.request === 'function') {
      const res = await this.provider.request({
        method: 'hedera_sendTransaction',
        params: [Array.from(transaction)],
      });
      // the wallet may return a Uint8Array-like or hex string; try to normalize
      if (res instanceof Uint8Array) return res;
      if (typeof res === 'string') return Uint8Array.from(Buffer.from(res.replace(/^0x/, ''), 'hex'));
      if (Array.isArray(res)) return Uint8Array.from(res as number[]);
    }

    throw new Error('requestTransaction not supported by provider');
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) return [];
    try {
      if (typeof this.provider.request === 'function') {
        const res = await this.provider.request({ method: 'hedera_getAccounts', params: [] });
        if (Array.isArray(res)) return res as string[];
      }
    } catch (err) {
      // ignore
    }
    return [];
  }
}
