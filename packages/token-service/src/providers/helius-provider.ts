import {
    TokenInfo,
    TokenBalance,
    WalletPortfolio,
    ValidationError,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { HeliusClient } from '@solana-api-toolkit/helius';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';

/**
 * Helius implementation of TokenDataProvider
 */
export class HeliusProvider implements TokenDataProvider {
    readonly name = 'helius';
    readonly priority: number;
    private client: HeliusClient;

    constructor(config: ProviderConfig) {
        this.client = new HeliusClient({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });
        this.priority = config.priority ?? 1;
    }

    /**
     * Get token price from Helius
     * Note: Helius doesn't directly provide price data, so this is a placeholder
     * In a real implementation, you might use Helius DAS API or another endpoint
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // This is a placeholder - in reality, you'd implement this using the appropriate Helius endpoint
        // For now, we'll throw an error to indicate this isn't implemented
        throw new Error('Token price data not available from Helius provider');
    }

    /**
     * Get token metadata from Helius
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const metadata = await this.client.getTokenMetadata(mint);

        return {
            mint: metadata.mint,
            name: metadata.name,
            symbol: metadata.symbol,
            decimals: metadata.decimals,
            logoUrl: metadata.image
        };
    }

    /**
     * Get token balances for a wallet from Helius
     */
    async getTokenBalances(address: string): Promise<TokenBalance[]> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid wallet address', 'address');
        }

        return this.client.getTokenBalances(address);
    }

    /**
     * Get wallet portfolio from Helius
     */
    async getWalletPortfolio(address: string): Promise<WalletPortfolio> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid wallet address', 'address');
        }

        return this.client.getWalletPortfolio(address);
    }
} 