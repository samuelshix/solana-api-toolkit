import { ValidationError } from '@solana-api-toolkit/core';
import { BirdeyeProvider } from '../../../src/providers';

// Mock the BirdeyeClient
jest.mock('../../../src/providers/birdeye-provider', () => {
    const originalModule = jest.requireActual('../../../src/providers/birdeye-provider');

    // Create a mock for the BirdeyeClient class
    class MockBirdeyeClient {
        getPrice = jest.fn();
        getTokenInfo = jest.fn();
    }

    // Override the BirdeyeProvider to use our mock client
    const mockBirdeyeProvider = {
        ...originalModule,
        BirdeyeProvider: class extends originalModule.BirdeyeProvider {
            constructor(config: any) {
                super(config);
                // Replace the client with our mock
                (this as any).client = new MockBirdeyeClient();
            }
        }
    };

    return mockBirdeyeProvider;
});

describe('BirdeyeProvider', () => {
    const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

    let provider: BirdeyeProvider;
    let mockClient: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create a new provider
        provider = new BirdeyeProvider({
            apiKey: 'test-api-key'
        });

        // Get a reference to the mocked client
        mockClient = (provider as any).client;
    });

    describe('getTokenPrice', () => {
        it('should fetch token price from Birdeye API', async () => {
            // Mock the client response
            const mockResponse = {
                data: {
                    value: 1.0,
                    valueChange24h: 0.01,
                    updateUnixTime: Date.now() / 1000
                }
            };

            mockClient.getPrice.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenPrice(validMint);

            expect(result).toBeDefined();
            expect(result.mint).toBe(validMint);
            expect(result.priceUsd).toBe(1.0);
            expect(result.priceChangePercentage24h).toBe(0.01);
            expect(result.provider).toBe('birdeye');
            expect(mockClient.getPrice).toHaveBeenCalledWith(validMint);
        });

        it('should throw a validation error for invalid mint address', async () => {
            await expect(provider.getTokenPrice('invalid-mint')).rejects.toThrow(ValidationError);
            expect(mockClient.getPrice).not.toHaveBeenCalled();
        });

        it('should throw an error if token price is not found', async () => {
            // Mock an empty response
            mockClient.getPrice.mockResolvedValueOnce({ data: null });

            await expect(provider.getTokenPrice(validMint)).rejects.toThrow(
                `Price data not available for token ${validMint}`
            );
        });
    });

    describe('getTokenMetadata', () => {
        it('should fetch token metadata from Birdeye API', async () => {
            // Mock the client response
            const mockResponse = {
                success: true,
                data: {
                    address: validMint,
                    decimals: 6,
                    name: 'USD Coin',
                    symbol: 'USDC',
                    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
                }
            };

            mockClient.getTokenInfo.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenMetadata(validMint);

            expect(result).toBeDefined();
            expect(result.mint).toBe(validMint);
            expect(result.name).toBe('USD Coin');
            expect(result.symbol).toBe('USDC');
            expect(result.decimals).toBe(6);
            expect(result.logoUrl).toBe('https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png');
            expect(mockClient.getTokenInfo).toHaveBeenCalledWith(validMint);
        });

        it('should throw a validation error for invalid mint address', async () => {
            await expect(provider.getTokenMetadata('invalid-mint')).rejects.toThrow(ValidationError);
            expect(mockClient.getTokenInfo).not.toHaveBeenCalled();
        });
    });
}); 