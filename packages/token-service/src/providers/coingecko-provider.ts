import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';

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
        return this.get<any>(`/coins/solana/contract/${contractAddress}`, undefined, {
            'x-cg-pro-api-key': this.config.apiKey
        });
    }

    /**
     * Get token prices for multiple tokens
     */
    async getTokenPrices(contractAddresses: string[]): Promise<any> {
        const addressesParam = contractAddresses.join(',');
        return this.get<any>(`/simple/token_price/solana`, {
            contract_addresses: addressesParam,
            vs_currencies: 'usd',
            include_market_cap: 'true',
            include_24hr_vol: 'true',
            include_24hr_change: 'true'
        }, { 'x-cg-pro-api-key': this.config.apiKey });
    }

    /**
     * Get coin data by ID
     */
    async getCoinById(coinId: string): Promise<any> {
        return this.get<any>(`/coins/${coinId}`);
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

    // Map of known token addresses to CoinGecko IDs
    private tokenAddressMap: Record<string, string> = {
        'So11111111111111111111111111111111111111112': 'solana',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether',
        // Add more mappings as needed
    };

    constructor(config: ProviderConfig) {
        this.client = new CoinGeckoClient(config);
        this.priority = config.priority ?? 2;
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
                volume24h: response.market_data.total_volume.usd,
                marketCap: response.market_data.market_cap.usd,
                provider: this.name,
                timestamp: Date.now()
            };
        } catch (error) {
            // If direct lookup fails, try using the mapping
            if (this.tokenAddressMap[mint]) {
                const response = await this.client.getCoinById(this.tokenAddressMap[mint]);

                if (!response || !response.market_data || response.market_data.current_price.usd === undefined) {
                    throw new Error(`Price data not available for token ${mint}`);
                }

                return {
                    mint,
                    priceUsd: response.market_data.current_price.usd,
                    priceChangePercentage24h: response.market_data.price_change_percentage_24h,
                    volume24h: response.market_data.total_volume.usd,
                    marketCap: response.market_data.market_cap.usd,
                    provider: this.name,
                    timestamp: Date.now()
                };
            }

            throw new Error(`Price data not available for token ${mint}`);
        }
    }

    /**
     * Get token metadata from CoinGecko
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        try {
            // Try direct contract address lookup first
            const response = await this.client.getTokenPrice(mint);

            if (!response) {
                throw new Error('Token data not available');
            }

            return {
                mint,
                name: response.name,
                symbol: response.symbol.toUpperCase(),
                decimals: 0, // CoinGecko doesn't provide decimals
                logoUrl: response.image?.large,
                priceUsd: response.market_data?.current_price?.usd
            };
        } catch (error) {
            // If direct lookup fails, try using the mapping
            if (this.tokenAddressMap[mint]) {
                const response = await this.client.getCoinById(this.tokenAddressMap[mint]);

                if (!response) {
                    throw new Error(`Token data not available for ${mint}`);
                }

                return {
                    mint,
                    name: response.name,
                    symbol: response.symbol.toUpperCase(),
                    decimals: 0, // CoinGecko doesn't provide decimals
                    logoUrl: response.image?.large,
                    priceUsd: response.market_data?.current_price?.usd
                };
            }

            throw new Error(`Token data not available for ${mint}`);
        }
    }
} 