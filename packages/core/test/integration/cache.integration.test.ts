import { SimpleCache } from '../../src/utils';

describe('SimpleCache Integration Tests', () => {
    let cache: SimpleCache<any>;

    beforeEach(() => {
        cache = new SimpleCache<any>();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should cache and retrieve complex objects', () => {
        const complexObject = {
            id: 1,
            name: 'Test',
            nested: {
                value: 'nested value',
                array: [1, 2, 3]
            },
            date: new Date()
        };

        cache.set('complex', complexObject, 1000);
        const retrieved = cache.get('complex');

        expect(retrieved).toEqual(complexObject);
        expect(retrieved).toBe(complexObject); // Same reference
    });

    it('should handle multiple cache entries with different TTLs', () => {
        cache.set('short', 'short-lived', 500);
        cache.set('medium', 'medium-lived', 1000);
        cache.set('long', 'long-lived', 2000);

        // All values should be available initially
        expect(cache.get('short')).toBe('short-lived');
        expect(cache.get('medium')).toBe('medium-lived');
        expect(cache.get('long')).toBe('long-lived');

        // Advance time by 600ms
        jest.advanceTimersByTime(600);

        // Short-lived value should be expired
        expect(cache.get('short')).toBeUndefined();
        expect(cache.get('medium')).toBe('medium-lived');
        expect(cache.get('long')).toBe('long-lived');

        // Advance time by another 500ms (total 1100ms)
        jest.advanceTimersByTime(500);

        // Medium-lived value should be expired
        expect(cache.get('short')).toBeUndefined();
        expect(cache.get('medium')).toBeUndefined();
        expect(cache.get('long')).toBe('long-lived');

        // Advance time by another 1000ms (total 2100ms)
        jest.advanceTimersByTime(1000);

        // All values should be expired
        expect(cache.get('short')).toBeUndefined();
        expect(cache.get('medium')).toBeUndefined();
        expect(cache.get('long')).toBeUndefined();
    });

    it('should handle cache operations with large data sets', () => {
        // Create a large data set
        const largeData = Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            value: Math.random()
        }));

        // Cache the large data set
        cache.set('largeData', largeData, 1000);

        // Retrieve the large data set
        const retrieved = cache.get('largeData');

        // Verify the data
        expect(retrieved).toEqual(largeData);
        expect(retrieved).toBe(largeData); // Same reference
        expect(retrieved.length).toBe(1000);
    });

    it('should handle concurrent cache operations', () => {
        // Set multiple cache entries
        for (let i = 0; i < 100; i++) {
            cache.set(`key${i}`, `value${i}`, 1000);
        }

        // Verify all entries
        for (let i = 0; i < 100; i++) {
            expect(cache.get(`key${i}`)).toBe(`value${i}`);
        }

        // Delete some entries
        for (let i = 0; i < 50; i += 2) {
            cache.delete(`key${i}`);
        }

        // Verify deleted and non-deleted entries
        for (let i = 0; i < 50; i++) {
            if (i % 2 === 0) {
                expect(cache.get(`key${i}`)).toBeUndefined();
            } else {
                expect(cache.get(`key${i}`)).toBe(`value${i}`);
            }
        }

        // Clear the cache
        cache.clear();

        // Verify all entries are gone
        for (let i = 0; i < 100; i++) {
            expect(cache.get(`key${i}`)).toBeUndefined();
        }
    });

    it('should handle updating existing cache entries', () => {
        // Set initial value
        cache.set('key', 'initial value', 1000);
        expect(cache.get('key')).toBe('initial value');

        // Update the value
        cache.set('key', 'updated value', 2000);
        expect(cache.get('key')).toBe('updated value');

        // Advance time by 1100ms
        jest.advanceTimersByTime(1100);

        // Value should still be available (new TTL)
        expect(cache.get('key')).toBe('updated value');

        // Advance time by another 1000ms (total 2100ms)
        jest.advanceTimersByTime(1000);

        // Value should be expired
        expect(cache.get('key')).toBeUndefined();
    });
}); 