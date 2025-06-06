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
            return this.request<any>('GET', `/coins/solana/contract/${contractAddress}`, {
                headers: {
                    'x-cg-pro-api-key': this.config.apiKey
                }
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
            return this.request<any>('GET', `/simple/token_price/solana`, {
                headers: {
                    'x-cg-pro-api-key': this.config.apiKey
                },
                params: {
                    contract_addresses: addressesParam,
                    vs_currencies: 'usd'
                }
            });
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
            return this.request<any>('GET', `/coins/${coinId}`, {
                headers: {
                    'x-cg-pro-api-key': this.config.apiKey
                }
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
            // If lookup with mint fails, try using the mapping
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
            } else {
                throw new Error('Coingecko ID does not exist in current mapping')
            }
        }
    }

    /**
     * Get token metadata from CoinGecko (calls getTokenPrice for metadata)
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

            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Token data not available for ${mint}: ${errorMessage}`);
        }
    }
} 