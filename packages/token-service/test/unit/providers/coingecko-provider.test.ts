import { ValidationError } from '@solana-api-toolkit/core';
import { CoinGeckoProvider } from '../../../src/providers/coingecko-provider';
import { ProviderConfig } from '../../../src/types';

// Mock p-retry to avoid ESM issues
jest.mock('p-retry', () => {
    return jest.fn((fn) => fn());
});

// Mock the HttpClient from the core package
jest.mock('@solana-api-toolkit/core', () => {
    const original = jest.requireActual('@solana-api-toolkit/core');

    // Create a proper mock for HttpClient
    class MockHttpClient {
        config: any;

        constructor(config: any) {
            this.config = config;
        }

        // Create a properly typed mock function for the get method that supports mockImplementationOnce
        get = jest.fn() as jest.Mock;

        // Add other methods that might be used
        request = jest.fn() as jest.Mock;
    }

    return {
        ...original,
        HttpClient: MockHttpClient
    };
});
jest.mock('../../../src/providerCoinMappings/coingecko/coingecko.json', () => ({
    // Define our mock mapping here
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',  // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',    // USDT
    // Note: Deliberately NOT including the mint we want to fail
}));
describe('CoinGeckoProvider', () => {
    let provider: CoinGeckoProvider;
    const mockConfig: ProviderConfig = {
        apiKey: 'test-api-key',
        baseUrl: 'https://api.coingecko.com/api/v3',
        timeout: 5000,
        maxRetries: 3,
        priority: 5
    };

    beforeEach(() => {
        jest.clearAllMocks();
        provider = new CoinGeckoProvider(mockConfig);
    });

    describe('constructor', () => {
        it('should create a provider with the correct configuration', () => {
            expect(provider.name).toBe('coingecko');
            expect(provider.priority).toBe(5);
        });

        it('should use default priority if not provided', () => {
            const providerWithoutPriority = new CoinGeckoProvider({
                apiKey: 'test-api-key'
            });
            expect(providerWithoutPriority.priority).toBe(6);
        });
    });

    describe('getTokenPrice', () => {
        const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
        const invalidMint = 'invalid-mint';
        const mockResponse = {
            id: 'usd-coin',
            symbol: 'usdc',
            name: 'USD Coin',
            details_platforms: {
                solana: {
                    decimals: 6
                }
            },
            market_data: {
                current_price: {
                    usd: 1.0
                },
                price_change_percentage_24h: 0.1,
                total_volume: {
                    usd: 1000000
                },
                market_cap: {
                    usd: 5000000000
                }
            },
            image: {
                large: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
            }
        };

        it('should throw ValidationError for invalid mint address', async () => {
            await expect(provider.getTokenPrice(invalidMint)).rejects.toThrow(ValidationError);
        });

        it('should return token price when direct mint lookup succeeds', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenPrice(validMint);

            expect(result).toEqual({
                mint: validMint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: 'coingecko',
                timestamp: expect.any(Number)
            });

            // Verify we only called the direct mint endpoint
            expect(mockGet).toHaveBeenCalledTimes(1);
            expect(mockGet).toHaveBeenCalledWith(
                `/coins/solana/contract/${validMint}`,
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should fallback to coin ID mapping when direct mint lookup fails', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;

            // First attempt: direct mint lookup fails
            mockGet.mockRejectedValueOnce(new Error('Not found'));

            // Second attempt: coin ID lookup succeeds
            mockGet.mockResolvedValueOnce({
                ...mockResponse,
                id: 'usd-coin'  // Make sure the coin ID is explicit in the response
            });

            const result = await provider.getTokenPrice(validMint);

            expect(result).toEqual({
                mint: validMint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: 'coingecko',
                timestamp: expect.any(Number)
            });

            // Verify both API calls were made in the correct order
            expect(mockGet).toHaveBeenCalledTimes(2);
            expect(mockGet).toHaveBeenNthCalledWith(
                1,
                `/coins/solana/contract/${validMint}`,
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
            expect(mockGet).toHaveBeenNthCalledWith(
                2,
                '/coins/usd-coin',
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should throw error when price data is missing from response', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce({
                id: 'usd-coin',
                symbol: 'usdc',
                name: 'USD Coin',
                // Missing market_data to test error handling
            });

            await expect(provider.getTokenPrice(validMint)).rejects.toThrow('Price data not available');

            // Verify we tried the direct mint lookup, then the api call using the ID
            expect(mockGet).toHaveBeenCalledTimes(2);
        });

        it('should throw error when mint does not exist in current mapping', async () => {
            const unknownMint = 'So11111111111111111111111111111111111111113'; // Unknown mint

            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;

            // First attempt: direct mint lookup fails
            mockGet.mockRejectedValueOnce(new Error('Not found'));

            await expect(provider.getTokenPrice(unknownMint)).rejects.toThrow(
                'Coingecko ID does not exist in current mapping'
            );

            // Verify only the first attempt was made since the mint isn't in the mapping
            expect(mockGet).toHaveBeenCalledTimes(1);
            expect(mockGet).toHaveBeenCalledWith(
                `/coins/solana/contract/${unknownMint}`,
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should throw error when direct lookup fails and coin ID lookup fails', async () => {
            const knownMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

            // Mock the tokenAddressMap to include our test mint
            // @ts-ignore - Accessing private property for testing
            provider.tokenAddressMap = {
                [knownMint]: 'usd-coin'
            };

            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;

            // First attempt: direct mint lookup fails
            mockGet.mockRejectedValueOnce(new Error('Not found'));

            // Second attempt: coin ID lookup fails
            mockGet.mockRejectedValueOnce(new Error('API error'));

            await expect(provider.getTokenPrice(knownMint)).rejects.toThrow(
                'Failed to get price using coin ID mapping: API error'
            );

            // Verify both attempts were made
            expect(mockGet).toHaveBeenCalledTimes(2);
            expect(mockGet).toHaveBeenNthCalledWith(
                1,
                `/coins/solana/contract/${knownMint}`,
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
            expect(mockGet).toHaveBeenNthCalledWith(
                2,
                '/coins/usd-coin',
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });
    });

    describe('getTokenMetadata', () => {
        const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
        const invalidMint = 'invalid-mint';
        const mockResponse = {
            id: 'usd-coin',
            symbol: 'usdc',
            name: 'USD Coin',
            details_platforms: {
                solana: {
                    decimals: 6
                }
            },
            market_data: {
                current_price: {
                    usd: 1.0
                }
            },
            image: {
                large: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png'
            }
        };

        it('should throw ValidationError for invalid mint address', async () => {
            await expect(provider.getTokenMetadata(invalidMint)).rejects.toThrow(ValidationError);
        });

        it('should return expected token metadata', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenMetadata(validMint);

            expect(result).toEqual({
                mint: validMint,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6, // From the decimals map
                logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
                priceUsd: 1.0
            });

            // @ts-ignore - Accessing private property for testing
            expect(mockGet).toHaveBeenCalledWith(
                `/coins/solana/contract/${validMint}`,
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should throw error when token data is not available', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce(null);

            await expect(provider.getTokenMetadata(validMint)).rejects.toThrow('Token data not available');
        });
    });
}); 