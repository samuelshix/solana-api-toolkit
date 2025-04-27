import { ValidationError } from '@solana-api-toolkit/core';
import { JupiterProvider } from '../../../src/providers';

// Mock the JupiterClient
jest.mock('../../../src/providers/jupiter-provider', () => {
    const originalModule = jest.requireActual('../../../src/providers/jupiter-provider');

    // Create a mock for the JupiterClient class
    class MockJupiterClient {
        getPrice = jest.fn();
        getTokenInfo = jest.fn();
    }

    // Override the JupiterProvider to use our mock client
    const mockJupiterProvider = {
        ...originalModule,
        JupiterProvider: class extends originalModule.JupiterProvider {
            constructor(config: any) {
                super(config);
                // Replace the client with our mock
                (this as any).client = new MockJupiterClient();
            }
        }
    };

    return mockJupiterProvider;
});

describe('JupiterProvider', () => {
    const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

    let provider: JupiterProvider;
    let mockClient: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create a new provider
        provider = new JupiterProvider({
            apiKey: 'test-api-key'
        });

        // Get a reference to the mocked client
        mockClient = (provider as any).client;
    });

    describe('getTokenPrice', () => {
        it('should fetch token price from Jupiter API', async () => {
            // Mock the client response
            const mockResponse = {
                data: {
                    [validMint]: {
                        id: validMint,
                        mintSymbol: 'USDC',
                        vsToken: 'USDC',
                        vsTokenSymbol: 'USDC',
                        price: 1.0,
                    }
                }
            };

            mockClient.getPrice.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenPrice(validMint);

            expect(result).toBeDefined();
            expect(result.mint).toBe(validMint);
            expect(result.priceUsd).toBe(1.0);
            expect(result.provider).toBe('jupiter');
            expect(mockClient.getPrice).toHaveBeenCalledWith(validMint);
        });

        it('should throw a validation error for invalid mint address', async () => {
            await expect(provider.getTokenPrice('invalid-mint')).rejects.toThrow(ValidationError);
            expect(mockClient.getPrice).not.toHaveBeenCalled();
        });

        it('should throw an error if token price is not found', async () => {
            // Mock an empty response
            mockClient.getPrice.mockResolvedValueOnce({ data: {} });

            await expect(provider.getTokenPrice(validMint)).rejects.toThrow(
                `Price data not available for token ${validMint}`
            );
        });
    });

    describe('getTokenMetadata', () => {
        it('should fetch token metadata from Jupiter API', async () => {
            // Mock the client response
            const mockResponse = {
                address: validMint,
                chainId: 101,
                decimals: 6,
                name: 'USD Coin',
                symbol: 'USDC',
                logo_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
                tags: ['stablecoin']
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