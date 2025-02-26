import { TokenInfo, TokenBalance, WalletPortfolio } from '@solana-api-toolkit/core';

/**
 * Provider configuration options
 */
export interface ProviderConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    priority?: number;
}

/**
 * Token service configuration
 */
export interface TokenServiceConfig {
    /** Helius provider configuration */
    helius?: ProviderConfig;
    /** Helius DAS provider configuration */
    heliusDas?: ProviderConfig;
    /** Jupiter provider configuration */
    jupiter?: ProviderConfig;
    /** Birdeye provider configuration */
    birdeye?: ProviderConfig;
    /** Solscan provider configuration */
    solscan?: ProviderConfig;
    /** CoinMarketCap provider configuration */
    coinmarketcap?: ProviderConfig;
    /** CoinGecko provider configuration */
    coingecko?: ProviderConfig;
    /** Pyth provider configuration */
    pyth?: ProviderConfig;
    /** Cache TTL in milliseconds */
    cacheTtl?: number;
    /** Default provider priority order */
    providerPriority?: ('helius' | 'heliusDas' | 'jupiter' | 'birdeye' | 'solscan' | 'coinmarketcap' | 'coingecko' | 'pyth')[];
}

/**
 * Token price information
 */
export interface TokenPrice {
    /** Token mint address */
    mint: string;
    /** Price in USD */
    priceUsd: number;
    /** Price change percentage (24h) */
    priceChangePercentage24h?: number | null;
    /** Volume (24h) */
    volume24h?: number;
    /** Market cap */
    marketCap?: number;
    /** Provider that supplied the data */
    provider: string;
    /** Timestamp when the price was fetched */
    timestamp: number;
}

/**
 * Token data provider interface
 */
export interface TokenDataProvider {
    /** Provider name */
    readonly name: string;
    /** Provider priority (lower is higher priority) */
    readonly priority: number;
    /** Get token price */
    getTokenPrice(mint: string): Promise<TokenPrice>;
    /** Get token metadata */
    getTokenMetadata(mint: string): Promise<TokenInfo>;
    /** Get token balances for a wallet */
    getTokenBalances?(address: string): Promise<TokenBalance[]>;
    /** Get wallet portfolio */
    getWalletPortfolio?(address: string): Promise<WalletPortfolio>;
} 