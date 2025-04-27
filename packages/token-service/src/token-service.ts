import {
    TokenInfo,
    TokenBalance,
    WalletPortfolio,
    ValidationError,
    SimpleCache,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import {
    TokenDataProvider,
    TokenServiceConfig,
    TokenPrice
} from './types';
import {
    JupiterProvider,
    BirdeyeProvider,
    SolscanProvider,
    HeliusDasProvider,
    CoinMarketCapProvider,
    CoinGeckoProvider,
    // PythProvider
} from './providers';

/**
 * Token service that combines multiple data providers
 */
export class TokenService {
    private providers: TokenDataProvider[] = [];
    private cache: SimpleCache<any>;
    private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private readonly PRICE_CACHE_TTL = 60 * 1000; // 1 minute for prices

    constructor(config: TokenServiceConfig = {}) {
        // Initialize cache
        this.cache = new SimpleCache<any>();

        // Initialize providers based on config
        this.initializeProviders(config);

        // Sort providers by priority
        this.providers.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Initialize providers based on configuration
     */
    private initializeProviders(config: TokenServiceConfig): void {
        // Add Helius DAS provider if configured
        if (config.heliusDas) {
            this.providers.push(new HeliusDasProvider(config.heliusDas));
        }

        // Add Jupiter provider if configured
        if (config.jupiter) {
            this.providers.push(new JupiterProvider(config.jupiter));
        }

        // Add Birdeye provider if configured
        if (config.birdeye) {
            this.providers.push(new BirdeyeProvider(config.birdeye));
        }

        // Add Solscan provider if configured
        if (config.solscan) {
            this.providers.push(new SolscanProvider(config.solscan));
        }

        // Add CoinMarketCap provider if configured
        if (config.coinmarketcap) {
            this.providers.push(new CoinMarketCapProvider(config.coinmarketcap));
        }

        // Add CoinGecko provider if configured
        if (config.coingecko) {
            this.providers.push(new CoinGeckoProvider(config.coingecko));
        }

        // Add Pyth provider if configured
        // if (config.pyth) {
        //     this.providers.push(new PythProvider(config.pyth));
        // }

        // If no providers were configured, throw an error
        if (this.providers.length === 0) {
            throw new Error('No token data providers configured');
        }
    }

    /**
     * Get token price with automatic fallback between providers
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Check cache first
        const cacheKey = `token-price:${mint}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Try each provider in order of priority
        const errors: Error[] = [];

        for (const provider of this.providers) {
            try {
                // Skip providers that don't implement getTokenPrice
                if (!provider.getTokenPrice) continue;

                const price = await provider.getTokenPrice(mint);

                // Cache the result
                this.cache.set(cacheKey, price, this.PRICE_CACHE_TTL);

                return price;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push(new Error(`${provider.name}: ${errorMessage}`));
                // Continue to next provider
            }
        }

        // If all providers failed, throw an error with details
        throw new Error(`Failed to get token price for ${mint}: ${errors.map(e => e.message).join(', ')}`);
    }

    /**
     * Get token metadata with automatic fallback between providers
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Check cache first
        const cacheKey = `token-metadata:${mint}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Try each provider in order of priority
        const errors: Error[] = [];

        for (const provider of this.providers) {
            try {
                // Skip providers that don't implement getTokenMetadata
                if (!provider.getTokenMetadata) continue;

                const metadata = await provider.getTokenMetadata(mint);

                // Cache the result
                this.cache.set(cacheKey, metadata, this.DEFAULT_CACHE_TTL);

                return metadata;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push(new Error(`${provider.name}: ${errorMessage}`));
                // Continue to next provider
            }
        }

        // If all providers failed, throw an error with details
        throw new Error(`Failed to get token metadata for ${mint}: ${errors.map(e => e.message).join(', ')}`);
    }

    /**
     * Get token balances for a wallet with automatic fallback between providers
     */
    async getTokenBalances(address: string): Promise<TokenBalance[]> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid wallet address', 'address');
        }

        // Check cache first
        const cacheKey = `token-balances:${address}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Try each provider in order of priority
        const errors: Error[] = [];

        for (const provider of this.providers) {
            try {
                // Skip providers that don't implement getTokenBalances
                if (!provider.getTokenBalances) continue;

                const balances = await provider.getTokenBalances(address);

                // Cache the result
                this.cache.set(cacheKey, balances, this.DEFAULT_CACHE_TTL);

                return balances;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push(new Error(`${provider.name}: ${errorMessage}`));
                // Continue to next provider
            }
        }

        // If all providers failed, throw an error with details
        throw new Error(`Failed to get token balances for ${address}: ${errors.map(e => e.message).join(', ')}`);
    }

    /**
     * Get wallet portfolio with automatic fallback between providers
     * Enriches with price data when available
     */
    async getWalletPortfolio(address: string): Promise<WalletPortfolio> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid wallet address', 'address');
        }

        // Check cache first
        const cacheKey = `wallet-portfolio:${address}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // Try each provider in order of priority
        const errors: Error[] = [];

        for (const provider of this.providers) {
            try {
                // Skip providers that don't implement getWalletPortfolio
                if (!provider.getWalletPortfolio) continue;

                const portfolio = await provider.getWalletPortfolio(address);

                // Enrich with price data if available
                await this.enrichPortfolioWithPrices(portfolio);

                // Cache the result
                this.cache.set(cacheKey, portfolio, this.DEFAULT_CACHE_TTL);

                return portfolio;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                errors.push(new Error(`${provider.name}: ${errorMessage}`));
                // Continue to next provider
            }
        }

        // If all providers failed, try to build a portfolio from token balances
        try {
            const balances = await this.getTokenBalances(address);

            // Create a basic portfolio
            const portfolio: WalletPortfolio = {
                address,
                solBalance: 0, // Would need to be fetched separately
                tokens: balances,
                totalValueUsd: 0 // Will be calculated below
            };

            // Enrich with price data
            await this.enrichPortfolioWithPrices(portfolio);

            // Cache the result
            this.cache.set(cacheKey, portfolio, this.DEFAULT_CACHE_TTL);

            return portfolio;
        } catch (error) {
            // If that also fails, include it in the errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(new Error(`fallback: ${errorMessage}`));
        }

        // If all approaches failed, throw an error with details
        throw new Error(`Failed to get wallet portfolio for ${address}: ${errors.map(e => e.message).join(', ')}`);
    }

    /**
     * Enrich a portfolio with price data
     */
    private async enrichPortfolioWithPrices(portfolio: WalletPortfolio): Promise<void> {
        let totalValueUsd = portfolio.solBalance * await this.getSolPrice();

        // Enrich each token with price data
        const pricePromises = portfolio.tokens.map(async (token) => {
            try {
                const price = await this.getTokenPrice(token.mint);

                if (token.tokenInfo) {
                    token.tokenInfo.priceUsd = price.priceUsd;
                    token.tokenInfo.priceChangePercentage24h = price.priceChangePercentage24h;
                }

                // Add to total value
                const tokenValueUsd = token.uiAmount * price.priceUsd;
                totalValueUsd += tokenValueUsd;
            } catch (error) {
                // If price fetch fails, just continue without price data
                console.warn(`Failed to get price for token ${token.mint}: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        await Promise.all(pricePromises);

        // Update total value
        portfolio.totalValueUsd = totalValueUsd;
    }

    /**
     * Get SOL price
     */
    private async getSolPrice(): Promise<number> {
        try {
            const solMint = 'So11111111111111111111111111111111111111112'; // Native SOL mint
            const price = await this.getTokenPrice(solMint);
            return price.priceUsd;
        } catch (error) {
            // Default to a reasonable SOL price if we can't fetch it
            console.warn(`Failed to get SOL price: ${error instanceof Error ? error.message : String(error)}`);
            return 0; // Return 0 to avoid inflating portfolio value with incorrect data
        }
    }

    /**
     * Get comprehensive token data combining metadata and price
     */
    async getTokenData(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Check cache first
        const cacheKey = `token-data:${mint}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        try {
            // Get metadata and price in parallel
            const [metadata, price] = await Promise.all([
                this.getTokenMetadata(mint).catch(error => {
                    console.warn(`Failed to get token metadata: ${error.message}`);
                    // Return basic metadata if full metadata fetch fails
                    return { mint, name: '', symbol: '', decimals: 0 } as TokenInfo;
                }),
                this.getTokenPrice(mint).catch(error => {
                    console.warn(`Failed to get token price: ${error.message}`);
                    // Return null if price fetch fails
                    return null;
                })
            ]);

            // Combine metadata and price
            const tokenData: TokenInfo = {
                ...metadata,
                priceUsd: price?.priceUsd,
                priceChangePercentage24h: price?.priceChangePercentage24h
            };

            // Cache the result
            this.cache.set(cacheKey, tokenData, this.PRICE_CACHE_TTL);

            return tokenData;
        } catch (error) {
            throw new Error(`Failed to get token data for ${mint}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
} 