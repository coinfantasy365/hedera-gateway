import { APIClient } from './client.js';
import { HCSManager } from './hcs.js';
import { HTSManager } from './hts.js';
import { WalletManager } from './wallet.js';
import { 
  SDKConfig, 
  OperationStatus, 
  GatewayHealth, 
  GatewayMetrics 
} from './types.js';

export class CoinFantasyHederaSDK {
  private client: APIClient;
  
  public readonly hcs: HCSManager;
  public readonly hts: HTSManager;
  public readonly wallet: WalletManager;

  constructor(config: SDKConfig) {
    // Basic validation: ensure required configuration is provided
    if (!config || !config.apiBaseUrl || !config.network) {
      throw new Error('Invalid SDK configuration: apiBaseUrl and network are required');
    }

    this.client = new APIClient(config);
    
    this.hcs = new HCSManager(this.client);
    this.hts = new HTSManager(this.client);
    this.wallet = new WalletManager();
  }

  /**
   * Get the status of a gateway operation
   */
  async getOperationStatus(operationId: string): Promise<OperationStatus> {
    const response = await this.client.get<{ operation: OperationStatus }>(`/hedera/gateway/operations/${operationId}`);
    return response.operation;
  }

  /**
   * Get gateway health status
   */
  async getGatewayHealth(): Promise<GatewayHealth> {
    const response = await this.client.get<{ health: GatewayHealth }>('/hedera/gateway/health');
    return response.health;
  }

  /**
   * Get gateway metrics
   */
  async getGatewayMetrics(): Promise<GatewayMetrics> {
    const response = await this.client.get<{ metrics: GatewayMetrics }>('/hedera/gateway/metrics');
    return response.metrics;
  }

  /**
   * Wait for operation to complete with polling
   */
  async waitForOperation(
    operationId: string, 
    options: {
      pollInterval?: number;
      timeout?: number;
    } = {}
  ): Promise<OperationStatus> {
    const pollInterval = options.pollInterval || 2000; // 2 seconds
    const timeout = options.timeout || 60000; // 1 minute
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getOperationStatus(operationId);
      
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Operation ${operationId} timed out after ${timeout}ms`);
  }

  /**
   * Initialize SDK with wallet connection if available
   */
  async initialize(): Promise<void> {
    // Try to restore wallet connection
    this.wallet.restoreConnection();
    
    // Verify gateway health
    try {
      const health = await this.getGatewayHealth();
      if (health.status !== 'healthy') {
        console.warn(`[CoinFantasy SDK] Gateway health status: ${health.status}`);
      }
    } catch (error) {
      console.warn('[CoinFantasy SDK] Failed to check gateway health:', error);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.wallet.disconnect();
  }
}

// Export all types for external use
export * from './types.js';
export { HCSManager } from './hcs.js';
export { HTSManager } from './hts.js';
export { WalletManager } from './wallet.js';

// Default export
export default CoinFantasyHederaSDK;