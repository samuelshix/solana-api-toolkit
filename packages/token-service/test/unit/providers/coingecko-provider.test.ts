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

        it('should return token price when direct lookup succeeds', async () => {
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

            // @ts-ignore - Accessing private property for testing
            expect(mockGet).toHaveBeenCalledWith(
                `/coins/solana/contract/${validMint}`,
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should use coin ID mapping when direct lookup fails', async () => {
            // First call fails, second call succeeds with coin ID
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;

            // Setup the mock to first reject, then resolve
            mockGet
                .mockRejectedValueOnce(new Error('Not found'))
                .mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenPrice(validMint);

            expect(result).toEqual({
                mint: validMint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: 'coingecko',
                timestamp: expect.any(Number)
            });

            // @ts-ignore - Accessing private property for testing
            expect(mockGet).toHaveBeenCalledTimes(2);
            // @ts-ignore - Accessing private property for testing
            expect(mockGet).toHaveBeenLastCalledWith(
                '/coins/usd-coin',
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should throw error when price data is not available', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce({
                id: 'usd-coin',
                symbol: 'usdc',
                name: 'USD Coin',
                // Missing market_data
            });

            await expect(provider.getTokenPrice(validMint)).rejects.toThrow('Price data not available');
        });

        it('should throw error when both direct lookup and mapping fail', async () => {
            const unknownMint = 'So11111111111111111111111111111111111111113'; // Unknown mint

            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockRejectedValueOnce(new Error('Not found'));

            await expect(provider.getTokenPrice(unknownMint)).rejects.toThrow(
                `Price data not available for token ${unknownMint}: Not found`
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

        it('should return token metadata when direct lookup succeeds', async () => {
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

        it('should use coin ID mapping when direct lookup fails', async () => {
            // First call fails, second call succeeds with coin ID
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;

            // Setup the mock to first reject, then resolve
            mockGet
                .mockRejectedValueOnce(new Error('Not found'))
                .mockResolvedValueOnce(mockResponse);

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
            expect(mockGet).toHaveBeenCalledTimes(2);
            // @ts-ignore - Accessing private property for testing
            expect(mockGet).toHaveBeenLastCalledWith(
                '/coins/usd-coin',
                undefined,
                { 'x-cg-pro-api-key': 'test-api-key' }
            );
        });

        it('should use default decimals when not in the map', async () => {
            // Use a valid Solana address that's not in the decimals map
            const unknownMint = '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo';

            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenMetadata(unknownMint);

            expect(result.decimals).toBe(0); // Default value
        });

        it('should throw error when token data is not available', async () => {
            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockResolvedValueOnce(null);

            await expect(provider.getTokenMetadata(validMint)).rejects.toThrow('Token data not available');
        });

        it('should throw error when both direct lookup and mapping fail', async () => {
            const unknownMint = 'So11111111111111111111111111111111111111113'; // Unknown mint

            // @ts-ignore - Accessing private property for testing
            const mockGet = provider.client.get as jest.Mock;
            mockGet.mockRejectedValueOnce(new Error('Not found'));

            await expect(provider.getTokenMetadata(unknownMint)).rejects.toThrow(
                `Token data not available for ${unknownMint}: Not found`
            );
        });
    });
}); 