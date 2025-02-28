import { SimpleCache as ISimpleCache, SimpleCache } from '@solana-api-toolkit/core';

/**
 * Mock SimpleCache for testing
 */
export class MockSimpleCache<T> extends SimpleCache<T> {
    private cacheMap: Map<string, { value: T; expires: number }> = new Map();
    private mockGetBehavior: 'normal' | 'always-miss' | 'always-hit' = 'normal';
    private mockValue: T | null = null;

    constructor() {
        super();
    }

    /**
     * Set the behavior of the get method
     * @param behavior 'normal' (default), 'always-miss', or 'always-hit'
     * @param mockValue Value to return when behavior is 'always-hit'
     */
    setMockGetBehavior(behavior: 'normal' | 'always-miss' | 'always-hit', mockValue: T | null = null): void {
        this.mockGetBehavior = behavior;
        this.mockValue = mockValue;
    }

    /**
     * Get a value from the cache
     */
    get(key: string): T | undefined {
        if (this.mockGetBehavior === 'always-miss') {
            return undefined;
        }

        if (this.mockGetBehavior === 'always-hit') {
            return this.mockValue as T;
        }

        const item = this.cacheMap.get(key);
        if (!item) return undefined;

        if (item.expires < Date.now()) {
            this.cacheMap.delete(key);
            return undefined;
        }

        return item.value;
    }

    /**
     * Set a value in the cache
     */
    set(key: string, value: T, ttl: number): void {
        const expires = Date.now() + ttl;
        this.cacheMap.set(key, { value, expires });
    }

    /**
     * Delete a value from the cache
     */
    delete(key: string): void {
        this.cacheMap.delete(key);
    }

    /**
     * Clear the entire cache
     */
    clear(): void {
        this.cacheMap.clear();
    }
} 