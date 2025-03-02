import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';
import tokenAddressMap from '../providerCoinMappings/coingecko/coingecko.json';

// TODO: paid plans must use pro-api.coingecko.com and free plans must use api.coingecko.com
/**
 * CoinGecko API client
 */
class CoinGeckoClient extends HttpClient {
    constructor(config: ProviderConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://api.coingecko.com/api/v3',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
    }

    /**
     * Get token price from CoinGecko by contract address
     */
    async getTokenPrice(contractAddress: string): Promise<any> {
        try {
            return this.get<any>(`/coins/solana/contract/${contractAddress}`, undefined, {
                'x-cg-pro-api-key': this.config.apiKey
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get token price for ${contractAddress}: ${errorMessage}`);
        }
    }

    /**
     * Get token prices for multiple tokens
     */
    async getTokenPrices(contractAddresses: string[]): Promise<any> {
        try {
            const addressesParam = contractAddresses.join(',');
            return this.get<any>(`/simple/token_price/solana`, {
                contract_addresses: addressesParam,
                vs_currencies: 'usd'
            }, { 'x-cg-pro-api-key': this.config.apiKey });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get token prices: ${errorMessage}`);
        }
    }

    /**
     * Get coin data by ID
     */
    async getCoinById(coinId: string): Promise<any> {
        try {
            return this.get<any>(`/coins/${coinId}`, undefined, {
                'x-cg-pro-api-key': this.config.apiKey
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get coin data for ${coinId}: ${errorMessage}`);
        }
    }
}

/**
 * CoinGecko implementation of TokenDataProvider
 * 
 * Why it's useful:
 * - Free tier with generous rate limits
 * - Comprehensive token coverage across multiple blockchains
 * - Provides market data including volume, market cap, etc.
 * - Supports batch requests for multiple tokens
 * - Well-documented API with consistent response format
 * - Community favorite for price data
 */
export class CoinGeckoProvider implements TokenDataProvider {
    readonly name = 'coingecko';
    readonly priority: number;
    private client: CoinGeckoClient;
    private tokenAddressMap: Record<string, string> = tokenAddressMap;
    // Map of token decimals for common tokens
    private tokenDecimalsMap: Record<string, number> = {
        'So11111111111111111111111111111111111111112': 9, // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6, // USDT
        '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E': 8, // BTC
        '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk': 8, // ETH
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 9, // mSOL
        'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ': 9, // DUST
        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 6, // JUP
        'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 6, // ORCA
        'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a': 8, // RNDR
    };

    constructor(config: ProviderConfig) {
        this.client = new CoinGeckoClient(config);
        this.priority = config.priority ?? 6; // Lower priority as it's a fallback
    }

    /**
     * Get token price from CoinGecko
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        try {
            // Try direct contract address lookup first
            const response = await this.client.getTokenPrice(mint);

            if (!response || !response.market_data || response.market_data.current_price.usd === undefined) {
                throw new Error('Price data not available');
            }

            return {
                mint,
                priceUsd: response.market_data.current_price.usd,
                priceChangePercentage24h: response.market_data.price_change_percentage_24h,
                provider: this.name,
                timestamp: Date.now()
            };
        } catch (error) {
            // If direct lookup fails, try using the mapping
            if (this.tokenAddressMap[mint]) {
                try {
                    const coinId = this.tokenAddressMap[mint];
                    const response = await this.client.getCoinById(coinId);

                    if (!response || !response.market_data || response.market_data.current_price.usd === undefined) {
                        throw new Error(`Price data not available for token ${mint}`);
                    }

                    return {
                        mint,
                        priceUsd: response.market_data.current_price.usd,
                        priceChangePercentage24h: response.market_data.price_change_percentage_24h,
                        provider: this.name,
                        timestamp: Date.now()
                    };
                } catch (mappingError) {
                    const errorMessage = mappingError instanceof Error ? mappingError.message : String(mappingError);
                    throw new Error(`Failed to get price using coin ID mapping: ${errorMessage}`);
                }
            }

            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Price data not available for token ${mint}: ${errorMessage}`);
        }
    }

    /**
     * Get token metadata from CoinGecko
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError(`Invalid token mint address: ${mint}`);
        }

        try {
            const response = await this.client.getTokenPrice(mint);

            if (!response) {
                throw new Error(`Token data not available for ${mint}`);
            }
            if (!response.details_platforms.solana) {
                throw new ValidationError(`Token decimals not available for ${mint}`);
            }

            return {
                mint,
                name: response.name,
                symbol: response.symbol.toUpperCase(),
                decimals: response.details_platforms.solana.decimals,
                logoUrl: response.image?.large,
                priceUsd: response.market_data?.current_price?.usd
            };
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            // If direct lookup fails, try using the mapping
            if (this.tokenAddressMap[mint]) {
                try {
                    const coinId = this.tokenAddressMap[mint];
                    const response = await this.client.getCoinById(coinId);

                    if (!response) {
                        throw new Error(`Token data not available for ${mint}`);
                    }

                    // Use our decimals map if available, otherwise default to 0
                    const decimals = this.tokenDecimalsMap[mint] || 0;

                    return {
                        mint,
                        name: response.name,
                        symbol: response.symbol.toUpperCase(),
                        decimals,
                        logoUrl: response.image?.large,
                        priceUsd: response.market_data?.current_price?.usd
                    };
                } catch (mappingError) {
                    const errorMessage = mappingError instanceof Error ? mappingError.message : String(mappingError);
                    throw new Error(`Failed to get metadata using coin ID mapping: ${errorMessage}`);
                }
            }

            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Token data not available for ${mint}: ${errorMessage}`);
        }
    }
} 