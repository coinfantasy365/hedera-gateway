/**
 * Jest test setup file
 */

// Mock HashPack wallet for testing
Object.defineProperty(window, 'hashpack', {
  writable: true,
  value: {
    connectToLocalWallet: jest.fn().mockResolvedValue({
      accountIds: ['0.0.123456'],
      network: 'testnet',
      publicKey: 'mock-public-key'
    }),
    disconnect: jest.fn(),
    requestTransaction: jest.fn().mockRejectedValue(new Error('Not implemented in tests'))
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      operationId: 'mock-operation-id',
      transactionId: 'mock-transaction-id',
      status: 'COMPLETED'
    }),
  } as Response)
);

// Mock axios to avoid real HTTP requests during tests. We simulate behavior based on baseURL.
jest.mock('axios', () => {
  return {
    create: (opts: any) => ({
      interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
      get: jest.fn((url: string) => {
        // Return a mock operation status for known test paths
        return Promise.resolve({ data: { id: 'mock-op', status: 'COMPLETED' } });
      }),
      post: jest.fn((url: string, data: any) => {
        // If the baseURL was set to an invalid host in tests, simulate network error
        if (opts && typeof opts.baseURL === 'string' && opts.baseURL.includes('invalid-url')) {
          return Promise.reject(new Error('Network Error'));
        }
        return Promise.resolve({ data: { operationId: 'mock-operation-id', transactionId: 'mock-transaction-id' } });
      }),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
    })
  };
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});