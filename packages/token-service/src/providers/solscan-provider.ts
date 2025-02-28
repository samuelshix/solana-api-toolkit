import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';
// TODO: validate and fix
/**
 * Solscan API client
 */
class SolscanClient extends HttpClient {
    constructor(config: ProviderConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://public-api.solscan.io',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
    }

    /**
     * Get token price from Solscan
     */
    async getPrice(mint: string): Promise<any> {
        return this.get<any>(`/market/token/${mint}`);
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
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.client.getPrice(mint);

        if (!response || !response.priceUsdt) {
            throw new Error(`Price data not available for token ${mint}`);
        }

        return {
            mint,
            priceUsd: parseFloat(response.priceUsdt),
            priceChangePercentage24h: response.priceChange24h,
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
            name: response.name,
            symbol: response.symbol,
            decimals: response.decimals,
            logoUrl: response.icon,
            priceUsd: response.price
        };
    }
} 