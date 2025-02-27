import {
    TokenInfo,
    TokenBalance,
    WalletPortfolio,
    ValidationError,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';
import { Helius } from 'helius-sdk';

/**
 * Helius DAS API implementation of TokenDataProvider
 */
export class HeliusDasProvider implements TokenDataProvider {
    readonly name = 'helius-das';
    readonly priority: number;
    private client: Helius;
    private assetCache: Map<string, any> = new Map();
    private cacheTtl: number;
    private cacheTimestamps: Map<string, number> = new Map();

    constructor(config: ProviderConfig) {
        this.client = new Helius(config.apiKey);
        this.priority = config.priority ?? 1;
        this.cacheTtl = config.cacheTtl || 60000; // Default 1 minute cache
    }

    /**
     * Get asset data with caching to reduce API calls
     * @private
     */
    private async getAssetData(mint: string): Promise<any> {
        const cacheKey = `asset:${mint}`;
        const now = Date.now();

        // Check if we have a valid cached response
        if (this.assetCache.has(cacheKey)) {
            const timestamp = this.cacheTimestamps.get(cacheKey) || 0;
            if (now - timestamp < this.cacheTtl) {
                return this.assetCache.get(cacheKey);
            }
        }

        // Fetch fresh data
        const response = await this.client.rpc.getAsset({
            id: mint
        });

        if (!response || !response.content) {
            throw new Error(`Asset data not available for token ${mint}`);
        }

        // Cache the response
        this.assetCache.set(cacheKey, response);
        this.cacheTimestamps.set(cacheKey, now);

        return response;
    }

    /**
     * Get token price from Helius DAS API
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.getAssetData(mint);

        // Check if price data is available in the token metadata
        if (!response.token_info?.price_info || !response.token_info.price_info.price_per_token) {
            throw new Error(`Price data not available for token ${mint} in DAS API`);
        }

        return {
            mint,
            priceUsd: response.token_info.price_info.price_per_token,
            priceChangePercentage24h: undefined,
            provider: this.name,
            timestamp: Date.now()
        };
    }

    /**
     * Get token metadata from Helius DAS API
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const response = await this.getAssetData(mint);

        return {
            mint: response.id,
            name: response.content?.metadata?.name || '',
            symbol: response.content?.metadata?.symbol || '',
            decimals: response.content?.metadata?.attributes || 0,
            logoUrl: response.content?.links?.image || response.content?.metadata?.image || '',
            priceUsd: response.token_info?.price_info?.price_per_token
        };
    }

    /**
     * Get token balances for a wallet from Helius DAS API
     */
    async getTokenBalances(address: string): Promise<TokenBalance[]> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid wallet address', 'address');
        }

        const response = await this.client.rpc.getAssetsByOwner({
            ownerAddress: address,
            page: 1
        });

        if (!response || !response.items) {
            throw new Error(`Asset data not available for wallet ${address}`);
        }

        return response.items.map((asset: any) => {
            return {
                mint: asset.id,
                amount: asset.token_info?.amount || '0',
                uiAmount: asset.token_info?.amount
                    ? parseInt(asset.token_info.amount) / Math.pow(10, asset.content?.metadata?.decimals || 0)
                    : 0,
                tokenInfo: {
                    mint: asset.id,
                    name: asset.content?.metadata?.name || '',
                    symbol: asset.content?.metadata?.symbol || '',
                    decimals: asset.content?.metadata?.decimals || 0,
                    logoUrl: asset.content?.links?.image || asset.content?.metadata?.image || '',
                    priceUsd: asset.token_info?.price_info?.price_per_token
                }
            };
        });
    }

    /**
     * Get wallet portfolio from Helius DAS API
     */
    async getWalletPortfolio(address: string): Promise<WalletPortfolio> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid wallet address', 'address');
        }

        const tokens = await this.getTokenBalances(address);

        // Get SOL balance using Helius SDK
        const solBalance = await this.getSolBalance(address);

        return {
            address,
            solBalance,
            tokens,
            totalValueUsd: tokens.reduce((total, token) => {
                const tokenValue = token.uiAmount * (token.tokenInfo?.priceUsd || 0);
                return total + tokenValue;
            }, 0) + (solBalance * await this.getSolPrice())
        };
    }

    // TODO: fix
    /**
     * Get SOL balance for a wallet
     * @private
     */
    private async getSolBalance(address: string): Promise<number> {
        try {
            const balance = await (this.client.rpc as any).getBalance(address);
            // const balance = await this.client.rpc.getBalance(address);
            return balance.lamports / 1e9; // Convert lamports to SOL
        } catch (error) {
            console.warn(`Failed to get SOL balance for ${address}: ${error}`);
            return 0;
        }
    }

    /**
     * Get current SOL price
     * @private
     */
    private async getSolPrice(): Promise<number> {
        try {
            // Try to get SOL price from Helius
            const solMint = 'So11111111111111111111111111111111111111112';
            const response = await this.getAssetData(solMint);

            if (response?.token_info?.price_info?.price_per_token) {
                return response.token_info.price_info.price_per_token;
            }

            return 0;
        } catch (error) {
            console.warn(`Failed to get SOL price: ${error}`);
            return 0;
        }
    }
}