import { ValidationError } from '@solana-api-toolkit/core';
import { TokenService } from '../../src/token-service';
import { MockTokenDataProvider } from '../mocks/providers';
import { TokenPrice, TokenServiceConfig } from '../../src/types';

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
    const MockProvider = jest.fn().mockImplementation((config) => ({
        name: config?.name || 'MockProvider',
        priority: config?.priority || 1,
        getTokenPrice: jest.fn(),
        getTokenMetadata: jest.fn(),
        getTokenBalances: jest.fn(),
        getWalletPortfolio: jest.fn()
    }));

    return {
        JupiterProvider: jest.fn().mockImplementation((config) => ({
            name: 'JupiterProvider',
            priority: config?.priority || 2,
            getTokenPrice: jest.fn(),
            getTokenMetadata: jest.fn(),
            getTokenBalances: jest.fn(),
            getWalletPortfolio: jest.fn()
        })),
        BirdeyeProvider: jest.fn().mockImplementation((config) => ({
            name: 'BirdeyeProvider',
            priority: config?.priority || 3,
            getTokenPrice: jest.fn(),
            getTokenMetadata: jest.fn(),
            getTokenBalances: jest.fn(),
            getWalletPortfolio: jest.fn()
        })),
        SolscanProvider: MockProvider,
        HeliusDasProvider: MockProvider,
        CoinMarketCapProvider: MockProvider,
        CoinGeckoProvider: MockProvider,
        PythProvider: MockProvider
    };
});

describe('TokenService', () => {
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
        mockProvider.getTokenPrice = jest.fn().mockImplementation(mockProvider.getTokenPrice);
        mockProvider.getTokenMetadata = jest.fn().mockImplementation(mockProvider.getTokenMetadata);
        mockProvider.getTokenBalances = jest.fn().mockImplementation(mockProvider.getTokenBalances);
        mockProvider.getWalletPortfolio = jest.fn().mockImplementation(mockProvider.getWalletPortfolio);

        // Create a token service with the mock provider
        tokenService = new TokenService({
            jupiter: { apiKey: 'test-api-key' }
        });

        // Replace the providers with our mock provider
        (tokenService as any).providers = [mockProvider];

        // Get a reference to the mocked cache
        mockCache = (tokenService as any).cache;
    });

    describe('constructor', () => {
        it('should initialize with providers based on config', () => {
            const config: TokenServiceConfig = {
                jupiter: { apiKey: 'jupiter-api-key' },
                birdeye: { apiKey: 'birdeye-api-key' }
            };

            const service = new TokenService(config);

            // Should have 2 providers
            expect((service as any).providers.length).toBe(2);
        });

        it('should throw an error if no providers are configured', () => {
            expect(() => new TokenService({})).toThrow('No token data providers configured');
        });

        it('should sort providers by priority', () => {
            const config: TokenServiceConfig = {
                jupiter: { apiKey: 'jupiter-api-key', priority: 2 },
                birdeye: { apiKey: 'birdeye-api-key', priority: 1 }
            };

            const service = new TokenService(config);
            const providers = (service as any).providers;

            // Birdeye should be first (priority 1)
            expect(providers[0].name).toBe('BirdeyeProvider');
            // Jupiter should be second (priority 2)
            expect(providers[1].name).toBe('JupiterProvider');
        });
    });

    describe('getTokenPrice', () => {
        it('should throw a validation error for invalid mint address', async () => {
            await expect(tokenService.getTokenPrice('invalid-mint')).rejects.toThrow(ValidationError);
        });

        it('should return cached price if available', async () => {
            const mockPrice: TokenPrice = {
                mint: validMint,
                priceUsd: 1.0,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock cache hit
            mockCache.get.mockReturnValueOnce(mockPrice);

            const result = await tokenService.getTokenPrice(validMint);

            expect(result).toBe(mockPrice);
            expect(mockCache.get).toHaveBeenCalledWith(`token-price:${validMint}`);
            expect(mockProvider.getTokenPrice).not.toHaveBeenCalled();
        });

        it('should fetch price from provider if not cached', async () => {
            const mockPrice: TokenPrice = {
                mint: validMint,
                priceUsd: 1.0,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock cache miss
            mockCache.get.mockReturnValueOnce(undefined);

            // Mock provider response
            mockProvider.setMockTokenPrice(mockPrice);

            const result = await tokenService.getTokenPrice(validMint);

            expect(result).toEqual(mockPrice);
            expect(mockCache.get).toHaveBeenCalledWith(`token-price:${validMint}`);
            expect(mockCache.set).toHaveBeenCalledWith(
                `token-price:${validMint}`,
                expect.objectContaining({ mint: validMint, priceUsd: 1.0 }),
                expect.any(Number)
            );
        });

        it('should try each provider until one succeeds', async () => {
            // Create multiple mock providers
            const mockProvider1 = new MockTokenDataProvider('Provider1', 1);
            const mockProvider2 = new MockTokenDataProvider('Provider2', 2);

            // First provider will fail
            mockProvider1.setShouldThrowOnGetTokenPrice(true);

            // Second provider will succeed
            const mockPrice: TokenPrice = {
                mint: validMint,
                priceUsd: 1.0,
                provider: 'Provider2',
                timestamp: Date.now()
            };
            mockProvider2.setMockTokenPrice(mockPrice);

            // Replace the providers
            (tokenService as any).providers = [mockProvider1, mockProvider2];

            // Mock cache miss
            mockCache.get.mockReturnValueOnce(undefined);

            const result = await tokenService.getTokenPrice(validMint);

            expect(result).toEqual(mockPrice);
        });

        it('should throw an error if all providers fail', async () => {
            // Mock cache miss
            mockCache.get.mockReturnValueOnce(undefined);

            // Provider will fail
            mockProvider.setShouldThrowOnGetTokenPrice(true);

            await expect(tokenService.getTokenPrice(validMint)).rejects.toThrow(
                `Failed to get token price for ${validMint}`
            );
        });
    });

    describe('getTokenMetadata', () => {
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

    describe('getTokenBalances', () => {
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

    describe('getWalletPortfolio', () => {
        it('should throw a validation error for invalid wallet address', async () => {
            await expect(tokenService.getWalletPortfolio('invalid-address')).rejects.toThrow(ValidationError);
        });

        it('should return cached portfolio if available', async () => {
            const mockPortfolio = {
                address: validAddress,
                solBalance: 1.5,
                tokens: [
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
                ],
                totalValueUsd: 100.0
            };

            // Mock cache hit
            mockCache.get.mockReturnValueOnce(mockPortfolio);

            const result = await tokenService.getWalletPortfolio(validAddress);

            expect(result).toBe(mockPortfolio);
            expect(mockCache.get).toHaveBeenCalledWith(`wallet-portfolio:${validAddress}`);
            expect(mockProvider.getWalletPortfolio).not.toHaveBeenCalled();
        });

        it('should fetch portfolio from provider if not cached', async () => {
            const mockPortfolio = {
                address: validAddress,
                solBalance: 1.5,
                tokens: [
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
                ],
                totalValueUsd: 0 // Will be calculated by enrichPortfolioWithPrices
            };

            const mockPrice = {
                mint: validMint,
                priceUsd: 1.0,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            const solMint = 'So11111111111111111111111111111111111111112';
            const mockSolPrice = {
                mint: solMint,
                priceUsd: 50.0,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock cache misses
            mockCache.get.mockReturnValueOnce(undefined); // portfolio cache miss
            mockCache.get.mockReturnValueOnce(undefined); // SOL price cache miss
            mockCache.get.mockReturnValueOnce(undefined); // token price cache miss

            // Mock provider responses
            mockProvider.setMockWalletPortfolio(mockPortfolio);
            mockProvider.setMockTokenPrice(mockSolPrice); // For getSolPrice

            // Create a new mock provider for the token price (since we already used the first one for SOL)
            const priceProvider = new MockTokenDataProvider('PriceProvider', 2);
            priceProvider.setMockTokenPrice(mockPrice);
            (tokenService as any).providers.push(priceProvider);

            const result = await tokenService.getWalletPortfolio(validAddress);

            expect(result.address).toBe(validAddress);
            expect(result.tokens).toHaveLength(1);
            expect(mockCache.set).toHaveBeenCalledWith(
                `wallet-portfolio:${validAddress}`,
                expect.objectContaining({ address: validAddress }),
                expect.any(Number)
            );
        });

        it('should fall back to building portfolio from token balances if providers fail', async () => {
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

            // Mock cache misses
            mockCache.get.mockReturnValue(undefined);

            // Provider will fail for getWalletPortfolio but succeed for getTokenBalances
            mockProvider.setShouldThrowOnGetWalletPortfolio(true);
            mockProvider.setMockTokenBalances(mockBalances);

            // Mock the getSolPrice method to return 0 to simplify the test
            jest.spyOn(tokenService as any, 'getSolPrice').mockResolvedValue(0);

            const result = await tokenService.getWalletPortfolio(validAddress);

            expect(result.address).toBe(validAddress);
            expect(result.tokens).toEqual(mockBalances);
            expect(result.solBalance).toBe(0);
        });

        it('should throw an error if all approaches fail', async () => {
            // Mock cache miss
            mockCache.get.mockReturnValue(undefined);

            // All provider methods will fail
            mockProvider.setShouldThrowOnGetWalletPortfolio(true);
            mockProvider.setShouldThrowOnGetTokenBalances(true);

            await expect(tokenService.getWalletPortfolio(validAddress)).rejects.toThrow(
                `Failed to get wallet portfolio for ${validAddress}`
            );
        });
    });

    describe('getTokenData', () => {
        it('should throw a validation error for invalid mint address', async () => {
            await expect(tokenService.getTokenData('invalid-mint')).rejects.toThrow(ValidationError);
        });

        it('should return cached token data if available', async () => {
            const mockTokenData = {
                mint: validMint,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1
            };

            // Mock cache hit
            mockCache.get.mockReturnValueOnce(mockTokenData);

            const result = await tokenService.getTokenData(validMint);

            expect(result).toBe(mockTokenData);
            expect(mockCache.get).toHaveBeenCalledWith(`token-data:${validMint}`);
        });

        it('should combine metadata and price data if not cached', async () => {
            const mockMetadata = {
                mint: validMint,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6
            };

            const mockPrice = {
                mint: validMint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock cache miss for token data
            mockCache.get.mockReturnValueOnce(undefined);

            // Mock getTokenMetadata and getTokenPrice to return our mock data
            jest.spyOn(tokenService, 'getTokenMetadata').mockResolvedValueOnce(mockMetadata);
            jest.spyOn(tokenService, 'getTokenPrice').mockResolvedValueOnce(mockPrice);

            const result = await tokenService.getTokenData(validMint);

            expect(result).toEqual({
                ...mockMetadata,
                priceUsd: mockPrice.priceUsd,
                priceChangePercentage24h: mockPrice.priceChangePercentage24h
            });

            expect(mockCache.set).toHaveBeenCalledWith(
                `token-data:${validMint}`,
                expect.objectContaining({
                    mint: validMint,
                    priceUsd: 1.0,
                    priceChangePercentage24h: 0.1
                }),
                expect.any(Number)
            );
        });

        it('should handle metadata fetch failure gracefully', async () => {
            const mockPrice = {
                mint: validMint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock cache miss for token data
            mockCache.get.mockReturnValueOnce(undefined);

            // Mock getTokenMetadata to fail and getTokenPrice to succeed
            jest.spyOn(tokenService, 'getTokenMetadata').mockRejectedValueOnce(new Error('Metadata fetch failed'));
            jest.spyOn(tokenService, 'getTokenPrice').mockResolvedValueOnce(mockPrice);

            // Mock console.warn to avoid polluting test output
            jest.spyOn(console, 'warn').mockImplementation(() => { });

            const result = await tokenService.getTokenData(validMint);

            expect(result).toEqual({
                mint: validMint,
                name: '',
                symbol: '',
                decimals: 0,
                priceUsd: mockPrice.priceUsd,
                priceChangePercentage24h: mockPrice.priceChangePercentage24h
            });
        });

        it('should handle price fetch failure gracefully', async () => {
            const mockMetadata = {
                mint: validMint,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6
            };

            // Mock cache miss for token data
            mockCache.get.mockReturnValueOnce(undefined);

            // Mock getTokenMetadata to succeed and getTokenPrice to fail
            jest.spyOn(tokenService, 'getTokenMetadata').mockResolvedValueOnce(mockMetadata);
            jest.spyOn(tokenService, 'getTokenPrice').mockRejectedValueOnce(new Error('Price fetch failed'));

            // Mock console.warn to avoid polluting test output
            jest.spyOn(console, 'warn').mockImplementation(() => { });

            const result = await tokenService.getTokenData(validMint);

            expect(result).toEqual({
                ...mockMetadata,
                priceUsd: undefined,
                priceChangePercentage24h: undefined
            });
        });
    });

    describe('getSolPrice', () => {
        it('should return the SOL price from getTokenPrice', async () => {
            const solMint = 'So11111111111111111111111111111111111111112';
            const mockPrice = {
                mint: solMint,
                priceUsd: 50.0,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock getTokenPrice to return our mock price
            jest.spyOn(tokenService, 'getTokenPrice').mockResolvedValueOnce(mockPrice);

            const result = await (tokenService as any).getSolPrice();

            expect(result).toBe(50.0);
            expect(tokenService.getTokenPrice).toHaveBeenCalledWith(solMint);
        });

        it('should return 0 if getTokenPrice fails', async () => {
            // Mock getTokenPrice to fail
            jest.spyOn(tokenService, 'getTokenPrice').mockRejectedValueOnce(new Error('Price fetch failed'));

            // Mock console.warn to avoid polluting test output
            jest.spyOn(console, 'warn').mockImplementation(() => { });

            const result = await (tokenService as any).getSolPrice();

            expect(result).toBe(0);
        });
    });

    describe('enrichPortfolioWithPrices', () => {
        it('should enrich portfolio with price data', async () => {
            const portfolio = {
                address: validAddress,
                solBalance: 1.5,
                tokens: [
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
                ],
                totalValueUsd: 0
            };

            const mockSolPrice = 50.0;
            const mockTokenPrice = {
                mint: validMint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: 'TestProvider',
                timestamp: Date.now()
            };

            // Mock getSolPrice and getTokenPrice
            jest.spyOn(tokenService as any, 'getSolPrice').mockResolvedValueOnce(mockSolPrice);
            jest.spyOn(tokenService, 'getTokenPrice').mockResolvedValueOnce(mockTokenPrice);

            await (tokenService as any).enrichPortfolioWithPrices(portfolio);

            // SOL value: 1.5 * 50.0 = 75.0
            // Token value: 1.0 * 1.0 = 1.0
            // Total value: 75.0 + 1.0 = 76.0
            expect(portfolio.totalValueUsd).toBe(76.0);
            expect(portfolio.tokens[0].tokenInfo?.symbol).toBe('USDC');
        });

        it('should handle price fetch failures gracefully', async () => {
            const portfolio = {
                address: validAddress,
                solBalance: 1.5,
                tokens: [
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
                ],
                totalValueUsd: 0
            };

            // Mock getSolPrice to return 0 and getTokenPrice to fail
            jest.spyOn(tokenService as any, 'getSolPrice').mockResolvedValueOnce(0);
            jest.spyOn(tokenService, 'getTokenPrice').mockRejectedValueOnce(new Error('Price fetch failed'));

            // Mock console.warn to avoid polluting test output
            jest.spyOn(console, 'warn').mockImplementation(() => { });

            await (tokenService as any).enrichPortfolioWithPrices(portfolio);

            // Total value should be 0 since both price fetches failed
            expect(portfolio.totalValueUsd).toBe(0);
            // The symbol should still be there since we're not modifying the tokenInfo object
            expect(portfolio.tokens[0].tokenInfo?.symbol).toBe('USDC');
        });
    });
}); 