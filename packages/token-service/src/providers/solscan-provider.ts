import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';
/**
 * Solscan API client
 */
class SolscanClient extends HttpClient {
    constructor(config: ProviderConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://public-api.solscan.io/v2.0',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
    }

    /**
     * Get token price from Solscan
     */
    async getPrice(mint: string): Promise<any> {
        return this.get<any>(`/token/price?tokenAddress=${mint}`);
    }

    /**
     * Get token metadata from Solscan
     */
    async getTokenInfo(mint: string): Promise<any> {
        return this.get<any>(`/token/meta?tokenAddress=${mint}`);
    }
}

/**
 * Solscan implementation of TokenDataProvider
 * Requires paid API plan
 */
export class SolscanProvider implements TokenDataProvider {
    readonly name = 'solscan';
    readonly priority: number;
    private client: SolscanClient;

    constructor(config: ProviderConfig) {
        this.client = new SolscanClient(config);
        this.priority = config.priority ?? 4;
    }

    /**
     * Get token price from Solscan
     * Uses getTokenMetadata to get price as it returns price change percentage whereas getTokenPrice does not
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getTokenInfo(mint);

        if (!response || !response.priceUsdt) {
            throw new Error(`Price data not available for token ${mint}`);
        }

        return {
            mint,
            priceUsd: response.data.price,
            priceChangePercentage24h: response.data.price_change_24h,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    /**
     * Get token metadata from Solscan
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getTokenInfo(mint);

        if (!response || !response.success) {
            throw new Error(`Token metadata not available for ${mint}`);
        }

        return {
            mint,
            name: response.data.name,
            symbol: response.data.symbol,
            decimals: response.data.decimals,
            logoUrl: response.data.icon,
            priceUsd: response.data.price
        };
    }
} 