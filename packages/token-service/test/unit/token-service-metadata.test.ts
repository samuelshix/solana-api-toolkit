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

describe('TokenService - getTokenMetadata', () => {
    const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

    let mockProvider: MockTokenDataProvider;
    let tokenService: TokenService;
    let mockCache: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create a mock provider
        mockProvider = new MockTokenDataProvider('TestProvider', 1);

        // Make the provider methods proper jest mock functions
        mockProvider.getTokenMetadata = jest.fn().mockImplementation(mockProvider.getTokenMetadata);

        // Create a token service with the mock provider
        tokenService = new TokenService({
            jupiter: { apiKey: 'test-api-key' }
        });

        // Replace the providers with our mock provider
        (tokenService as any).providers = [mockProvider];

        // Get a reference to the mocked cache
        mockCache = (tokenService as any).cache;
    });

    it('should throw a validation error for invalid mint address', async () => {
        await expect(tokenService.getTokenMetadata('invalid-mint')).rejects.toThrow(ValidationError);
    });

    it('should return cached metadata if available', async () => {
        const mockMetadata = {
            mint: validMint,
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: 'https://example.com/usdc.png'
        };

        // Mock cache hit
        mockCache.get.mockReturnValueOnce(mockMetadata);

        const result = await tokenService.getTokenMetadata(validMint);

        expect(result).toBe(mockMetadata);
        expect(mockCache.get).toHaveBeenCalledWith(`token-metadata:${validMint}`);
        expect(mockProvider.getTokenMetadata).not.toHaveBeenCalled();
    });

    it('should fetch metadata from provider if not cached', async () => {
        const mockMetadata = {
            mint: validMint,
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            logoURI: 'https://example.com/usdc.png'
        };

        // Mock cache miss
        mockCache.get.mockReturnValueOnce(undefined);

        // Mock provider response
        mockProvider.setMockTokenMetadata(mockMetadata);

        const result = await tokenService.getTokenMetadata(validMint);

        expect(result).toEqual(mockMetadata);
        expect(mockCache.get).toHaveBeenCalledWith(`token-metadata:${validMint}`);
        expect(mockCache.set).toHaveBeenCalledWith(
            `token-metadata:${validMint}`,
            expect.objectContaining({ mint: validMint, name: 'USD Coin' }),
            expect.any(Number)
        );
    });

    it('should throw an error if all providers fail', async () => {
        // Mock cache miss
        mockCache.get.mockReturnValueOnce(undefined);

        // Provider will fail
        mockProvider.setShouldThrowOnGetTokenMetadata(true);

        await expect(tokenService.getTokenMetadata(validMint)).rejects.toThrow(
            `Failed to get token metadata for ${validMint}`
        );
    });
}); 