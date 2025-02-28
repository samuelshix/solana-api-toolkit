import {
    isValidSolanaAddress,
    SimpleCache,
    formatNumber,
    lamportsToSol,
    tokenAmountToUiAmount,
    uiAmountToTokenAmount
} from '../../src/utils';

describe('isValidSolanaAddress', () => {
    it('should return true for valid Solana addresses', () => {
        const validAddresses = [
            'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            'So11111111111111111111111111111111111111112', // SOL
            '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' // Random valid address
        ];

        validAddresses.forEach(address => {
            expect(isValidSolanaAddress(address)).toBe(true);
        });
    });

    it('should return false for invalid Solana addresses', () => {
        const invalidAddresses = [
            '',
            'not-an-address',
            '0x1234567890123456789012345678901234567890' // Ethereum address
        ];

        invalidAddresses.forEach(address => {
            expect(isValidSolanaAddress(address)).toBe(false);
        });
    });
});

describe('SimpleCache', () => {
    let cache: SimpleCache<string>;

    beforeEach(() => {
        cache = new SimpleCache<string>();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should store and retrieve values', () => {
        cache.set('key1', 'value1', 1000);
        expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
        expect(cache.get('non-existent')).toBeUndefined();
    });

    it('should expire values after TTL', () => {
        cache.set('key1', 'value1', 1000); // 1 second TTL

        // Value should exist before expiry
        expect(cache.get('key1')).toBe('value1');

        // Advance time by 1001ms
        jest.advanceTimersByTime(1001);

        // Value should be expired now
        expect(cache.get('key1')).toBeUndefined();
    });

    it('should delete values', () => {
        cache.set('key1', 'value1', 1000);
        expect(cache.get('key1')).toBe('value1');

        cache.delete('key1');
        expect(cache.get('key1')).toBeUndefined();
    });

    it('should clear all values', () => {
        cache.set('key1', 'value1', 1000);
        cache.set('key2', 'value2', 1000);

        expect(cache.get('key1')).toBe('value1');
        expect(cache.get('key2')).toBe('value2');

        cache.clear();

        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
    });
});

describe('formatNumber', () => {
    it('should format numbers with default 2 decimal places', () => {
        expect(formatNumber(1234.5678)).toBe('1,234.57');
        expect(formatNumber(0.123)).toBe('0.12');
        expect(formatNumber(1000)).toBe('1,000.00');
    });

    it('should format numbers with specified decimal places', () => {
        expect(formatNumber(1234.5678, 0)).toBe('1,235');
        expect(formatNumber(1234.5678, 1)).toBe('1,234.6');
        expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
        expect(formatNumber(1234.5678, 4)).toBe('1,234.5678');
    });
});

describe('lamportsToSol', () => {
    it('should convert lamports to SOL correctly', () => {
        expect(lamportsToSol(1000000000)).toBe(1);
        expect(lamportsToSol(500000000)).toBe(0.5);
        expect(lamportsToSol(1)).toBe(0.000000001);
        expect(lamportsToSol(0)).toBe(0);
    });

    it('should handle string inputs', () => {
        expect(lamportsToSol('1000000000')).toBe(1);
        expect(lamportsToSol('500000000')).toBe(0.5);
    });
});

describe('tokenAmountToUiAmount', () => {
    it('should convert token amounts to UI amounts based on decimals', () => {
        // USDC has 6 decimals
        expect(tokenAmountToUiAmount('1000000', 6)).toBe(1);
        expect(tokenAmountToUiAmount('500000', 6)).toBe(0.5);

        // SOL has 9 decimals
        expect(tokenAmountToUiAmount('1000000000', 9)).toBe(1);
        expect(tokenAmountToUiAmount('500000000', 9)).toBe(0.5);

        // Some token with 18 decimals (like ERC20)
        expect(tokenAmountToUiAmount('1000000000000000000', 18)).toBe(1);
        expect(tokenAmountToUiAmount('500000000000000000', 18)).toBe(0.5);
    });

    it('should handle number inputs', () => {
        expect(tokenAmountToUiAmount(1000000, 6)).toBe(1);
        expect(tokenAmountToUiAmount(500000, 6)).toBe(0.5);
    });
});

describe('uiAmountToTokenAmount', () => {
    it('should convert UI amounts to token amounts based on decimals', () => {
        // USDC has 6 decimals
        expect(uiAmountToTokenAmount(1, 6)).toBe('1000000');
        expect(uiAmountToTokenAmount(0.5, 6)).toBe('500000');

        // SOL has 9 decimals
        expect(uiAmountToTokenAmount(1, 9)).toBe('1000000000');
        expect(uiAmountToTokenAmount(0.5, 9)).toBe('500000000');

        // Some token with 18 decimals (like ERC20)
        expect(uiAmountToTokenAmount(1, 18)).toBe('1000000000000000000');
        expect(uiAmountToTokenAmount(0.5, 18)).toBe('500000000000000000');
    });
}); 