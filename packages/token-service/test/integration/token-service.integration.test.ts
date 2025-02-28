import { TokenService } from '../../src/token-service';
import { TokenPrice, TokenServiceConfig } from '../../src/types';

// Mock the providers to avoid making real API calls
jest.mock('../../src/providers', () => {
    // Create a mock implementation of a provider
    class MockProvider {
        name: string;
        priority: number;

        constructor(name: string, priority: number = 1) {
            this.name = name;
            this.priority = priority;
        }

        async getTokenPrice(mint: string): Promise<TokenPrice> {
            return {
                mint,
                priceUsd: 1.0,
                priceChangePercentage24h: 0.1,
                provider: this.name,
                timestamp: Date.now()
            };
        }

        async getTokenMetadata(mint: string) {
            return {
                mint,
                name: 'Test Token',
                symbol: 'TEST',
                decimals: 6,
                logoURI: 'https://example.com/logo.png'
            };
        }

        async getTokenBalances(address: string) {
            return [
                {
                    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                    amount: '1000000',
                    decimals: 6,
                    uiAmount: 1.0,
                    tokenInfo: {
                        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6
                    }
                }
            ];
        }

        async getWalletPortfolio(address: string) {
            return {
                address,
                solBalance: 1.5,
                tokens: [
                    {
                        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                        amount: '1000000',
                        decimals: 6,
                        uiAmount: 1.0,
                        tokenInfo: {
                            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                            name: 'USD Coin',
                            symbol: 'USDC',
                            decimals: 6
                        }
                    }
                ],
                totalValueUsd: 0 // Will be calculated
            };
        }
    }

    return {
        JupiterProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('JupiterProvider', config?.priority);
        }),
        BirdeyeProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('BirdeyeProvider', config?.priority);
        }),
        SolscanProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('SolscanProvider', config?.priority);
        }),
        HeliusDasProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('HeliusDasProvider', config?.priority);
        }),
        CoinMarketCapProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('CoinMarketCapProvider', config?.priority);
        }),
        CoinGeckoProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('CoinGeckoProvider', config?.priority);
        }),
        PythProvider: jest.fn().mockImplementation((config) => {
            return new MockProvider('PythProvider', config?.priority);
        })
    };
});

describe('TokenService Integration Tests', () => {
    const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const validAddress = '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs';

    let tokenService: TokenService;

    beforeEach(() => {
        // Create a new token service for each test
        const config: TokenServiceConfig = {
            jupiter: { apiKey: 'test-api-key' },
            birdeye: { apiKey: 'test-api-key' }
        };

        tokenService = new TokenService(config);
    });

    it('should create a TokenService instance with multiple providers', () => {
        expect(tokenService).toBeInstanceOf(TokenService);
        expect((tokenService as any).providers.length).toBe(2);
    });

    it('should get token price', async () => {
        const price = await tokenService.getTokenPrice(validMint);

        expect(price).toBeDefined();
        expect(price.mint).toBe(validMint);
        expect(price.priceUsd).toBeDefined();
        expect(price.provider).toBe('JupiterProvider'); // First provider by priority
    });

    it('should get token metadata', async () => {
        const metadata = await tokenService.getTokenMetadata(validMint);

        expect(metadata).toBeDefined();
        expect(metadata.mint).toBe(validMint);
        expect(metadata.name).toBe('Test Token');
        expect(metadata.symbol).toBe('TEST');
        expect(metadata.decimals).toBe(6);
    });

    it('should get token balances', async () => {
        const balances = await tokenService.getTokenBalances(validAddress);

        expect(balances).toBeDefined();
        expect(balances.length).toBeGreaterThan(0);
        expect(balances[0].mint).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        expect(balances[0].uiAmount).toBe(1.0);
    });

    it('should get wallet portfolio', async () => {
        const portfolio = await tokenService.getWalletPortfolio(validAddress);

        expect(portfolio).toBeDefined();
        expect(portfolio.address).toBe(validAddress);
        expect(portfolio.solBalance).toBe(1.5);
        expect(portfolio.tokens.length).toBeGreaterThan(0);
        expect(portfolio.totalValueUsd).toBeGreaterThan(0); // Should be calculated
    });

    it('should get token data combining metadata and price', async () => {
        const tokenData = await tokenService.getTokenData(validMint);

        expect(tokenData).toBeDefined();
        expect(tokenData.mint).toBe(validMint);
        expect(tokenData.name).toBe('Test Token');
        expect(tokenData.symbol).toBe('TEST');
        expect(tokenData.decimals).toBe(6);
        expect(tokenData.priceUsd).toBeDefined();
        expect(tokenData.priceChangePercentage24h).toBeDefined();
    });

    it('should use cache for subsequent requests', async () => {
        // First request should go to the provider
        const price1 = await tokenService.getTokenPrice(validMint);

        // Spy on the cache get method
        const cacheSpy = jest.spyOn((tokenService as any).cache, 'get');

        // Second request should use the cache
        const price2 = await tokenService.getTokenPrice(validMint);

        expect(cacheSpy).toHaveBeenCalledWith(`token-price:${validMint}`);
        expect(price2).toBeDefined();
    });

    it('should handle provider priority correctly', async () => {
        // Create a service with providers in a specific order
        const config: TokenServiceConfig = {
            birdeye: { apiKey: 'test-api-key', priority: 1 },
            jupiter: { apiKey: 'test-api-key', priority: 2 }
        };

        // Create a new service instance for this test
        const service = new TokenService(config);

        // The first provider by priority should be used (Birdeye)
        const price = await service.getTokenPrice(validMint);

        expect(price.provider).toBe('BirdeyeProvider');
    });
}); 