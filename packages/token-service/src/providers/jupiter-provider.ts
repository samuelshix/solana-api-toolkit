import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';

// TODO: migrate to new Jupiter API https://station.jup.ag/docs/api/mints-in-market
/**
 * Jupiter API client
 */
class JupiterClient extends HttpClient {
    constructor(config: ProviderConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://price.jup.ag/v4',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
    }

    /**
     * Get token price from Jupiter
     */
    async getPrice(mint: string): Promise<any> {
        if (this.config.apiKey) {
            return this.get<any>(`/price?ids=${mint}`, undefined, {
                'x-api-key': this.config.apiKey
            });
        } else {
            return this.get<any>(`/price?ids=${mint}`);
        }
    }

    /**
     * Get token metadata from Jupiter
     */
    async getTokenInfo(mint: string): Promise<any> {
        return this.get<any>(`/tokens/v1/token/${mint}`);
    }
}

/**
 * Jupiter implementation of TokenDataProvider
 */
export class JupiterProvider implements TokenDataProvider {
    readonly name = 'jupiter';
    readonly priority: number;
    private client: JupiterClient;

    constructor(config: ProviderConfig) {
        this.client = new JupiterClient(config);
        this.priority = config.priority ?? 2;
    }

    /**
     * Get token price from Jupiter
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getPrice(mint);

        if (!response.data || !response.data[mint]) {
            throw new Error(`Price data not available for token ${mint}`);
        }

        const priceData = response.data[mint];

        return {
            mint,
            priceUsd: priceData.price,
            // priceChangePercentage24h: priceData.price_24h_change_percentage,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    /**
     * Get token metadata from Jupiter
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getTokenInfo(mint);

        return {
            mint,
            symbol: response.symbol,
            decimals: response.decimals,
            name: response.name,
            logoUrl: response.logo_url
        };
    }
} 