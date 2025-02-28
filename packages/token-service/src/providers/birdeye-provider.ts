import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';

/**
 * Birdeye API client
 */
class BirdeyeClient extends HttpClient {
    constructor(config: ProviderConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://public-api.birdeye.so',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
    }

    /**
     * Get token price from Birdeye
     */
    async getPrice(mint: string): Promise<any> {
        return this.get<any>(`/public/price?address=${mint}`, undefined, {
            'X-API-KEY': this.config.apiKey
        });
    }

    /**
     * Get token metadata from Birdeye
     */
    async getTokenInfo(mint: string): Promise<any> {
        return this.get<any>(`/public/token_list/detail?address=${mint}`, undefined, {
            'X-API-KEY': this.config.apiKey
        });
    }
}

/**
 * Birdeye implementation of TokenDataProvider
 */
export class BirdeyeProvider implements TokenDataProvider {
    readonly name = 'birdeye';
    readonly priority: number;
    private client: BirdeyeClient;

    constructor(config: ProviderConfig) {
        this.client = new BirdeyeClient(config);
        this.priority = config.priority ?? 3;
    }

    /**
     * Get token price from Birdeye
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getPrice(mint);

        if (!response.data || response.data.value === undefined) {
            throw new Error(`Price data not available for token ${mint}`);
        }

        return {
            mint,
            priceUsd: response.data.value,
            priceChangePercentage24h: response.data.valueChange24h,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    /**
     * Get token metadata from Birdeye
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getTokenInfo(mint);

        if (!response.success || !response.data) {
            throw new Error(`Token metadata not available for ${mint}`);
        }

        const tokenData = response.data;

        return {
            mint,
            name: tokenData.name,
            symbol: tokenData.symbol,
            decimals: tokenData.decimals,
            logoUrl: tokenData.logoURI,
            priceUsd: tokenData.price
        };
    }
} 