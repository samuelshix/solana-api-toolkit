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
     * Get token price Birdeye API call
     */
    async getPrice(mint: string): Promise<any> {
        return this.request<any>('GET', `/defi/price?address=${mint}`, {
            headers: {
                'X-API-KEY': this.config.apiKey
            }
        });
    }

    /**
     * Get token prices Birdeye API call
     */
    async getPrices(contractAddresses: string[]): Promise<any> {
        const addressesParam = contractAddresses.join(',');
        return this.request<any>('GET', `/defi/multi_price?list_address=${addressesParam}`, {
            headers: {
                'X-API-KEY': this.config.apiKey
            }
        });
    }

    /**
     * Get token metadata Birdeye API call
     */
    async getTokenInfo(mint: string): Promise<any> {
        return this.request<any>('GET', `/public/token_list/detail?address=${mint}`, {
            headers: {
                'X-API-KEY': this.config.apiKey
            }
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

        // const priceChangePercentage24h = (response.data.priceChange24h / (response.data.value - response.data.priceChange24h)) * 100;

        return {
            mint,
            priceUsd: response.data.value,
            priceChangePercentage24h: response.data.priceChange24h,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    // TODO: Use the multi price endpoint instead of successive single price calls. Can't validate this as requires paid plan
    // /**
    //  * Get token prices for multiple tokens from Birdeye (requires paid plan)
    //  */
    // async getTokenPrices(mints: string[]): Promise<TokenPrice[]> {
    //     const response = await this.client.getPrices(mints);

    //     if (!response.data || response.data.value === undefined) {
    //         throw new Error(`Price data not available for tokens: ${mints}`);
    //     }

    //     const tokenPrices: TokenPrice[] = [];

    //     for (const priceData in response.data) {
    //         const priceDataValue = response.data[priceData];
    //         const priceChangePercentage24h = (priceDataValue.priceChange24h / (priceDataValue.value - priceDataValue.priceChange24h)) * 100;
    //         tokenPrices.push({
    //             mint: priceData,
    //             priceUsd: priceDataValue.value,
    //             priceChangePercentage24h: priceChangePercentage24h,
    //             provider: this.name,
    //             timestamp: Date.now()
    //         });
    //     }

    //     // TODO: if the user only has free plan
    //     // return response.data.map((price: any) => this.getTokenPrice(price.address));
    // }

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