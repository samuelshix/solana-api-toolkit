import { TokenBalance, PaginationParams } from '@solana-api-toolkit/core';

/**
 * Helius API client configuration
 */
export interface HeliusConfig {
    /** Helius API key */
    apiKey: string;
    /** Base URL for Helius API */
    baseUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Cache TTL in milliseconds */
    cacheTtl?: number;
}

/**
 * Helius token balance response
 */
export interface HeliusTokenBalance {
    /** Token mint address */
    mint: string;
    /** Token owner */
    owner: string;
    /** Token amount */
    amount: string;
    /** Token decimals */
    decimals: number;
    /** Token UI amount */
    uiAmount: number;
}

/**
 * Helius token metadata
 */
export interface HeliusTokenMetadata {
    /** Token mint address */
    mint: string;
    /** Token name */
    name: string;
    /** Token symbol */
    symbol: string;
    /** Token decimals */
    decimals: number;
    /** Token URI */
    uri?: string;
    /** Token image URI */
    image?: string;
}

/**
 * Helius NFT information
 */
export interface HeliusNft {
    /** NFT mint address */
    mint: string;
    /** NFT name */
    name: string;
    /** NFT symbol */
    symbol: string;
    /** NFT collection information */
    collection?: {
        /** Collection name */
        name?: string;
        /** Collection family */
        family?: string;
    };
    /** NFT image URL */
    image?: string;
    /** NFT attributes */
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

/**
 * Helius transaction parameters
 */
export interface HeliusTransactionParams extends PaginationParams {
    /** Transaction types to filter by */
    types?: string[];
    /** Start timestamp */
    startTime?: number;
    /** End timestamp */
    endTime?: number;
} 