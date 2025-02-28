import { SimpleCache } from '../../src/utils';

describe('SimpleCache Integration Tests', () => {
    let cache: SimpleCache<any>;
    const DEFAULT_TTL = 60000; // 1 minute default TTL

    beforeEach(() => {
        cache = new SimpleCache<any>();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a cache instance', () => {
        expect(cache).toBeInstanceOf(SimpleCache);
    });

    it('should cache and retrieve a value', () => {
        const key = 'test-key';
        const value = { data: 'test-data' };

        cache.set(key, value, DEFAULT_TTL);
        const cachedValue = cache.get(key);

        expect(cachedValue).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
        const cachedValue = cache.get('non-existent-key');
        expect(cachedValue).toBeUndefined();
    });

    it('should respect TTL for cached items', () => {
        const key = 'ttl-test';
        const value = 'will-expire';
        const ttl = 1000; // 1 second

        cache.set(key, value, ttl);

        // Value should exist before expiration
        expect(cache.get(key)).toBe(value);

        // Advance time past TTL
        jest.advanceTimersByTime(ttl + 100);

        // Value should be gone after expiration
        expect(cache.get(key)).toBeUndefined();
    });

    it('should clear all cache entries', () => {
        cache.set('key1', 'value1', DEFAULT_TTL);
        cache.set('key2', 'value2', DEFAULT_TTL);

        cache.clear();

        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
    });

    it('should delete a specific cache entry', () => {
        cache.set('key1', 'value1', DEFAULT_TTL);
        cache.set('key2', 'value2', DEFAULT_TTL);

        cache.delete('key1');

        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBe('value2');
    });
}); 