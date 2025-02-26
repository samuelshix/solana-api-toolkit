import { PublicKey } from '@solana/web3.js';

/**
 * Validates if a string is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Simple in-memory cache implementation
 */
export class SimpleCache<T> {
    private cache: Map<string, { value: T; expiry: number }> = new Map();

    /**
     * Get a value from cache
     */
    get(key: string): T | undefined {
        const item = this.cache.get(key);
        if (!item) return undefined;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return undefined;
        }

        return item.value;
    }

    /**
     * Set a value in cache with TTL
     */
    set(key: string, value: T, ttlMs: number): void {
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttlMs
        });
    }

    /**
     * Delete a value from cache
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }
}

/**
 * Format a number to a fixed number of decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Convert raw token amount to UI amount based on decimals
 */
export function lamportsToSol(lamports: number | string): number {
    return Number(lamports) / 1e9;
}

/**
 * Convert raw token amount to UI amount based on decimals
 */
export function tokenAmountToUiAmount(amount: string | number, decimals: number): number {
    return Number(amount) / Math.pow(10, decimals);
}

/**
 * Convert UI amount to raw token amount based on decimals
 */
export function uiAmountToTokenAmount(amount: number, decimals: number): string {
    return (amount * Math.pow(10, decimals)).toString();
} 