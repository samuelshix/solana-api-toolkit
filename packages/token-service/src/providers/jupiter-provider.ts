import {
    TokenInfo,
    ValidationError,
    HttpClient,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';

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
        return this.get<any>(`/price?ids=${mint}`);
    }

    /**
     * Get token metadata from Jupiter
     */
    async getTokenInfo(mint: string): Promise<any> {
        // Jupiter doesn't have a dedicated token info endpoint
        // This is a placeholder - in a real implementation, you might use a different endpoint
        throw new Error('Token metadata not available from Jupiter provider');
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
            priceChangePercentage24h: priceData.price_24h_change_percentage,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    /**
     * Get token metadata from Jupiter
     * Note: Jupiter doesn't provide comprehensive token metadata
     * This is a placeholder that would need to be implemented with the appropriate endpoint
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // This is a placeholder - in reality, you'd implement this using the appropriate Jupiter endpoint
        // For now, we'll throw an error to indicate this isn't implemented
        throw new Error('Token metadata not available from Jupiter provider');
    }
} 