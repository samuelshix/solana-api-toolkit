/**
 * Validates if a string is a valid Solana address
 */
export declare function isValidSolanaAddress(address: string): boolean;
/**
 * Simple in-memory cache implementation
 */
export declare class SimpleCache<T> {
    private cache;
    /**
     * Get a value from cache
     */
    get(key: string): T | undefined;
    /**
     * Set a value in cache with TTL
     */
    set(key: string, value: T, ttlMs: number): void;
    /**
     * Delete a value from cache
     */
    delete(key: string): void;
    /**
     * Clear all cache
     */
    clear(): void;
}
/**
 * Format a number to a fixed number of decimal places
 */
export declare function formatNumber(num: number, decimals?: number): string;
/**
 * Convert raw token amount to UI amount based on decimals
 */
export declare function lamportsToSol(lamports: number | string): number;
/**
 * Convert raw token amount to UI amount based on decimals
 */
export declare function tokenAmountToUiAmount(amount: string | number, decimals: number): number;
/**
 * Convert UI amount to raw token amount based on decimals
 */
export declare function uiAmountToTokenAmount(amount: number, decimals: number): string;
