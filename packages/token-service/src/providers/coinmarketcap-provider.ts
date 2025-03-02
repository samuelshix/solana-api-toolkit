import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';

/**
 * CoinMarketCap API client
 */
class CoinMarketCapClient extends HttpClient {
    constructor(config: ProviderConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://pro-api.coinmarketcap.com/v2',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
    }

    /**
     * Get token price from CoinMarketCap
     */
    async getTokenPrice(symbol: string | string[]): Promise<any> {
        if (Array.isArray(symbol)) {
            return this.get<any>(`/cryptocurrency/quotes/latest`, {
                symbol: symbol.join(',')
            }, {
                'X-CMC_PRO_API_KEY': this.config.apiKey
            });
        }

        return this.get<any>(`/cryptocurrency/quotes/latest`, {
            symbol: symbol
        }, {
            'X-CMC_PRO_API_KEY': this.config.apiKey
        });
    }
}

/**
 * CoinMarketCap implementation of TokenDataProvider
 * 
 * Why it's useful:
 * - Industry standard for cryptocurrency price data
 * - High reliability and accuracy
 * - Comprehensive market data including volume, market cap, etc.
 * - Widely trusted by financial institutions and crypto projects
 * - Provides historical data and price changes over various timeframes
 */
export class CoinMarketCapProvider implements TokenDataProvider {
    readonly name = 'coinmarketcap';
    readonly priority: number;
    private client: CoinMarketCapClient;

    // Map of known token addresses to CoinMarketCap IDs
    private tokenAddressMap: Record<string, string> = {
        'So11111111111111111111111111111111111111112': 'SOL',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
        // Add more mappings as needed
    };

    constructor(config: ProviderConfig) {
        this.client = new CoinMarketCapClient(config);
        this.priority = config.priority ?? 2;
    }

    /**
     * Get token price from CoinMarketCap
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Check if we have a mapping for this token
        if (!this.tokenAddressMap[mint]) {
            throw new Error(`No CoinMarketCap mapping available for token ${mint}`);
        }

        const response = await this.client.getTokenPrice(mint);

        if (!response.data || !response.data[mint]) {
            throw new Error(`Price data not available for token ${mint}`);
        }

        const tokenData = response.data[mint];
        const quote = tokenData.quote.USD;

        return {
            mint,
            priceUsd: quote.price,
            priceChangePercentage24h: quote.percent_change_24h,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    /**
     * Get token metadata from CoinMarketCap
     * Note: CoinMarketCap doesn't provide comprehensive token metadata
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Check if we have a mapping for this token
        if (!this.tokenAddressMap[mint]) {
            throw new Error(`No CoinMarketCap mapping available for token ${mint}`);
        }

        const response = await this.client.getTokenPrice(mint);

        if (!response.data || !response.data[mint]) {
            throw new Error(`Data not available for token ${mint}`);
        }

        const tokenData = response.data[mint];
        const quote = tokenData.quote.USD;

        return {
            mint,
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: 0, // CoinMarketCap doesn't provide decimals
            priceUsd: quote.price
        };
    }
} 