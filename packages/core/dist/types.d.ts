/**
 * Base configuration for all API clients
 */
export interface ApiClientConfig {
    /** API key for authentication */
    apiKey: string;
    /** Base URL for the API */
    baseUrl?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Maximum number of retry attempts */
    maxRetries?: number;
    /** Cache TTL in milliseconds */
    cacheTtl?: number;
}
/**
 * Standard token information structure
 */
export interface TokenInfo {
    /** Token mint address */
    mint: string;
    /** Token symbol (e.g., "SOL", "USDC") */
    symbol: string;
    /** Token name */
    name: string;
    /** Token decimals */
    decimals: number;
    /** Token logo URL */
    logoUrl?: string;
    /** Token price in USD */
    priceUsd?: number;
    /** Token price change percentage (24h) */
    priceChangePercentage24h?: number;
}
/**
 * Token balance information
 */
export interface TokenBalance {
    /** Token mint address */
    mint: string;
    /** Token amount (raw) */
    amount: string;
    /** Token amount adjusted for decimals */
    uiAmount: number;
    /** Token information */
    tokenInfo?: TokenInfo;
}
/**
 * Wallet portfolio information
 */
export interface WalletPortfolio {
    /** Wallet address */
    address: string;
    /** SOL balance */
    solBalance: number;
    /** Token balances */
    tokens: TokenBalance[];
    /** Total portfolio value in USD */
    totalValueUsd?: number;
}
/**
 * Pagination parameters
 */
export interface PaginationParams {
    /** Page number */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Cursor for pagination */
    cursor?: string;
}
/**
 * Response with pagination
 */
export interface PaginatedResponse<T> {
    /** Response data */
    data: T[];
    /** Pagination information */
    pagination: {
        /** Total number of items */
        total: number;
        /** Current page */
        page: number;
        /** Items per page */
        limit: number;
        /** Next page cursor */
        nextCursor?: string;
    };
}
