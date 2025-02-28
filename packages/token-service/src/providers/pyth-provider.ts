import {
    TokenInfo,
    ValidationError,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { TokenDataProvider, ProviderConfig, TokenPrice } from '../types';
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

/**
 * Pyth Network implementation of TokenDataProvider
 * 
 * Why it's useful:
 * - High-quality price feeds used by major DeFi protocols
 * - Decentralized oracle network with multiple data sources
 * - Provides confidence intervals and price certainty metrics
 * - Fast updates with minimal latency
 * - Designed for financial applications requiring reliable price data
 * - Used by many Solana DeFi protocols for critical operations
 */
export class PythProvider implements TokenDataProvider {
    readonly name = 'pyth';
    readonly priority: number;
    private client: PythHttpClient;
    private connection: Connection;

    // Map of known token addresses to Pyth price account IDs
    private tokenToPythMap: Record<string, string> = {
        'So11111111111111111111111111111111111111112': 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG', // SOL/USD
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD', // USDC/USD
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': '3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL', // USDT/USD
        // Add more mappings as needed
    };

    constructor(config: ProviderConfig) {
        this.connection = new Connection(config.baseUrl || clusterApiUrl('mainnet-beta'));
        const pythPublicKey = getPythProgramKeyForCluster('mainnet-beta');
        this.client = new PythHttpClient(this.connection, pythPublicKey);
        this.priority = config.priority ?? 1;
    }

    /**
     * Get token price from Pyth Network
     */
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Check if we have a mapping for this token
        const pythPriceAccountId = this.tokenToPythMap[mint];
        if (!pythPriceAccountId) {
            throw new Error(`No Pyth price feed available for token ${mint}`);
        }

        try {
            // Updated to use the current Pyth API
            const priceData = await this.client.getAssetPricesFromAccounts([new PublicKey(pythPriceAccountId)]);

            if (!priceData || priceData.length === 0) {
                throw new Error(`Price feed not available for token ${mint}`);
            }

            const priceFeed = priceData[0];
            const price = priceFeed.aggregate

            if (!price) {
                throw new Error(`Recent price not available for token ${mint}`);
            }

            return {
                mint,
                priceUsd: price.price,
                provider: this.name,
                timestamp: Date.now(),
                // confidence: price.confidence,
                // status: String(priceFeed.status)
            } as TokenPrice;
            // & { confidence: number; status: string };
        } catch (error) {
            throw new Error(`Failed to get price from Pyth: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get token metadata
     * Note: Pyth doesn't provide token metadata, only price feeds
     */
    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        // Pyth doesn't provide token metadata, so we'll throw an error
        throw new Error('Token metadata not available from Pyth provider');
    }
} 