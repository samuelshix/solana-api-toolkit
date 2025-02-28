import { ValidationError } from '@solana-api-toolkit/core';
import { TokenService } from '../../src/token-service';
import { MockTokenDataProvider } from '../mocks/providers';

// Mock the SimpleCache
jest.mock('@solana-api-toolkit/core', () => {
    const originalModule = jest.requireActual('@solana-api-toolkit/core');

    return {
        ...originalModule,
        SimpleCache: jest.fn().mockImplementation(() => ({
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn()
        }))
    };
});

// Mock the providers
jest.mock('../../src/providers', () => {
    const MockProvider = jest.fn().mockImplementation(() => ({
        name: 'MockProvider',
        priority: 1,
        getTokenPrice: jest.fn(),
        getTokenMetadata: jest.fn(),
        getTokenBalances: jest.fn(),
        getWalletPortfolio: jest.fn()
    }));

    return {
        JupiterProvider: MockProvider,
        BirdeyeProvider: MockProvider,
        SolscanProvider: MockProvider,
        HeliusDasProvider: MockProvider,
        CoinMarketCapProvider: MockProvider,
        CoinGeckoProvider: MockProvider,
        PythProvider: MockProvider
    };
});

describe('TokenService - getTokenBalances', () => {
    const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const validAddress = '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs';

    let mockProvider: MockTokenDataProvider;
    let tokenService: TokenService;
    let mockCache: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create a mock provider
        mockProvider = new MockTokenDataProvider('TestProvider', 1);

        // Make the provider methods proper jest mock functions
        mockProvider.getTokenBalances = jest.fn().mockImplementation(mockProvider.getTokenBalances);

        // Create a token service with the mock provider
        tokenService = new TokenService({
            jupiter: { apiKey: 'test-api-key' }
        });

        // Replace the providers with our mock provider
        (tokenService as any).providers = [mockProvider];

        // Get a reference to the mocked cache
        mockCache = (tokenService as any).cache;
    });

    it('should throw a validation error for invalid wallet address', async () => {
        await expect(tokenService.getTokenBalances('invalid-address')).rejects.toThrow(ValidationError);
    });

    it('should return cached balances if available', async () => {
        const mockBalances = [
            {
                mint: validMint,
                amount: '1000000',
                decimals: 6,
                uiAmount: 1.0,
                tokenInfo: {
                    mint: validMint,
                    name: 'USD Coin',
                    symbol: 'USDC',
                    decimals: 6
                }
            }
        ];

        // Mock cache hit
        mockCache.get.mockReturnValueOnce(mockBalances);

        const result = await tokenService.getTokenBalances(validAddress);

        expect(result).toBe(mockBalances);
        expect(mockCache.get).toHaveBeenCalledWith(`token-balances:${validAddress}`);
        expect(mockProvider.getTokenBalances).not.toHaveBeenCalled();
    });

    it('should fetch balances from provider if not cached', async () => {
        const mockBalances = [
            {
                mint: validMint,
                amount: '1000000',
                decimals: 6,
                uiAmount: 1.0,
                tokenInfo: {
                    mint: validMint,
                    name: 'USD Coin',
                    symbol: 'USDC',
                    decimals: 6
                }
            }
        ];

        // Mock cache miss
        mockCache.get.mockReturnValueOnce(undefined);

        // Mock provider response
        mockProvider.setMockTokenBalances(mockBalances);

        const result = await tokenService.getTokenBalances(validAddress);

        expect(result).toEqual(mockBalances);
        expect(mockCache.get).toHaveBeenCalledWith(`token-balances:${validAddress}`);
        expect(mockCache.set).toHaveBeenCalledWith(
            `token-balances:${validAddress}`,
            mockBalances,
            expect.any(Number)
        );
    });

    it('should throw an error if all providers fail', async () => {
        // Mock cache miss
        mockCache.get.mockReturnValueOnce(undefined);

        // Provider will fail
        mockProvider.setShouldThrowOnGetTokenBalances(true);

        await expect(tokenService.getTokenBalances(validAddress)).rejects.toThrow(
            `Failed to get token balances for ${validAddress}`
        );
    });
}); 