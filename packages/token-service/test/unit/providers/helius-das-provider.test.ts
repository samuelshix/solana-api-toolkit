import { ValidationError } from '@solana-api-toolkit/core';
import { HeliusDasProvider } from '../../../src/providers';
import { Connection } from '@solana/web3.js';

// Mock the Helius SDK
jest.mock('helius-sdk', () => {
    return {
        Helius: jest.fn().mockImplementation(() => ({
            rpc: {
                getAsset: jest.fn(),
                getAssetsByOwner: jest.fn()
            }
        }))
    };
});

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => {
    const originalModule = jest.requireActual('@solana/web3.js');

    return {
        ...originalModule,
        Connection: jest.fn().mockImplementation(() => ({
            getBalance: jest.fn()
        }))
    };
});

describe('HeliusDasProvider', () => {
    const validMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const validAddress = '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs';

    let provider: HeliusDasProvider;
    let mockHeliusRpc: any;
    let mockConnection: jest.Mocked<Connection>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create a new provider
        provider = new HeliusDasProvider({
            apiKey: 'test-api-key'
        });

        // Get references to the mocked clients
        mockHeliusRpc = (provider as any).client.rpc;
        mockConnection = (provider as any).connection;
    });

    describe('getTokenPrice', () => {
        it('should fetch token price from Helius DAS API', async () => {
            // Mock the asset data response
            const mockResponse = {
                id: validMint,
                content: {
                    metadata: {
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6
                    }
                },
                token_info: {
                    price_info: {
                        price_per_token: 1.0,
                        price_change_percentage_24h: 0.01
                    }
                }
            };

            mockHeliusRpc.getAsset.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenPrice(validMint);

            expect(result).toBeDefined();
            expect(result.mint).toBe(validMint);
            expect(result.priceUsd).toBe(1.0);
            expect(result.priceChangePercentage24h).toBe(0.01);
            expect(result.provider).toBe('helius-das');
            expect(mockHeliusRpc.getAsset).toHaveBeenCalledWith({
                id: validMint
            });
        });

        it('should throw a validation error for invalid mint address', async () => {
            await expect(provider.getTokenPrice('invalid-mint')).rejects.toThrow(ValidationError);
            expect(mockHeliusRpc.getAsset).not.toHaveBeenCalled();
        });

        it('should throw an error if price data is not available', async () => {
            // Mock a response without price data
            const mockResponse = {
                id: validMint,
                content: {
                    metadata: {
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6
                    }
                },
                token_info: {}
            };

            mockHeliusRpc.getAsset.mockResolvedValueOnce(mockResponse);

            await expect(provider.getTokenPrice(validMint)).rejects.toThrow(
                `Price data not available for token ${validMint} in DAS API`
            );
        });
    });

    describe('getTokenMetadata', () => {
        it('should fetch token metadata from Helius DAS API', async () => {
            // Mock the asset data response
            const mockResponse = {
                id: validMint,
                content: {
                    metadata: {
                        name: 'USD Coin',
                        symbol: 'USDC',
                        decimals: 6
                    },
                    links: {
                        image: 'https://example.com/usdc.png'
                    }
                },
                token_info: {
                    price_info: {
                        price_per_token: 1.0
                    }
                }
            };

            mockHeliusRpc.getAsset.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenMetadata(validMint);

            expect(result).toBeDefined();
            expect(result.mint).toBe(validMint);
            expect(result.name).toBe('USD Coin');
            expect(result.symbol).toBe('USDC');
            expect(result.decimals).toBe(6);
            expect(result.logoUrl).toBe('https://example.com/usdc.png');
            expect(result.priceUsd).toBe(1.0);
            expect(mockHeliusRpc.getAsset).toHaveBeenCalledWith({
                id: validMint
            });
        });

        it('should throw a validation error for invalid mint address', async () => {
            await expect(provider.getTokenMetadata('invalid-mint')).rejects.toThrow(ValidationError);
            expect(mockHeliusRpc.getAsset).not.toHaveBeenCalled();
        });
    });

    describe('getTokenBalances', () => {
        it('should fetch token balances from Helius DAS API', async () => {
            // Mock the assets by owner response
            const mockResponse = {
                items: [
                    {
                        id: validMint,
                        content: {
                            metadata: {
                                name: 'USD Coin',
                                symbol: 'USDC',
                                decimals: 6
                            },
                            links: {
                                image: 'https://example.com/usdc.png'
                            }
                        },
                        token_info: {
                            amount: '1000000',
                            price_info: {
                                price_per_token: 1.0
                            }
                        }
                    }
                ]
            };

            mockHeliusRpc.getAssetsByOwner.mockResolvedValueOnce(mockResponse);

            const result = await provider.getTokenBalances(validAddress);

            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].mint).toBe(validMint);
            expect(result[0].amount).toBe('1000000');
            expect(result[0].uiAmount).toBe(1.0);
            expect(result[0].tokenInfo).toBeDefined();
            expect(result[0].tokenInfo?.name).toBe('USD Coin');
            expect(result[0].tokenInfo?.decimals).toBe(6);
            expect(mockHeliusRpc.getAssetsByOwner).toHaveBeenCalledWith({
                ownerAddress: validAddress,
                page: 1,
                limit: 100
            });
        });

        it('should throw a validation error for invalid wallet address', async () => {
            await expect(provider.getTokenBalances('invalid-address')).rejects.toThrow(ValidationError);
            expect(mockHeliusRpc.getAssetsByOwner).not.toHaveBeenCalled();
        });
    });

    describe('getWalletPortfolio', () => {
        it('should fetch wallet portfolio from Helius DAS API', async () => {
            // Mock the assets by owner response
            const mockAssetsResponse = {
                items: [
                    {
                        id: validMint,
                        content: {
                            metadata: {
                                name: 'USD Coin',
                                symbol: 'USDC',
                                decimals: 6
                            }
                        },
                        token_info: {
                            amount: '1000000',
                            price_info: {
                                price_per_token: 1.0
                            }
                        }
                    }
                ]
            };

            // Mock SOL balance response (2 SOL)
            const solBalance = 2 * 1e9; // 2 SOL in lamports

            // Mock SOL price response
            const mockSolResponse = {
                id: 'So11111111111111111111111111111111111111112',
                content: {
                    metadata: {
                        name: 'Wrapped SOL',
                        symbol: 'SOL',
                        decimals: 9
                    }
                },
                token_info: {
                    price_info: {
                        price_per_token: 50.0
                    }
                }
            };

            mockHeliusRpc.getAssetsByOwner.mockResolvedValueOnce(mockAssetsResponse);
            mockConnection.getBalance.mockResolvedValueOnce(solBalance);
            mockHeliusRpc.getAsset.mockResolvedValueOnce(mockSolResponse);

            const result = await provider.getWalletPortfolio(validAddress);

            expect(result).toBeDefined();
            expect(result.address).toBe(validAddress);
            expect(result.solBalance).toBe(2.0);
            expect(result.tokens.length).toBe(1);
            expect(result.tokens[0].mint).toBe(validMint);
            expect(result.tokens[0].uiAmount).toBe(1.0);

            // Total value should be: 1.0 USDC * $1.0 + 2.0 SOL * $50.0 = $101.0
            expect(result.totalValueUsd).toBe(101.0);
        });

        it('should throw a validation error for invalid wallet address', async () => {
            await expect(provider.getWalletPortfolio('invalid-address')).rejects.toThrow(ValidationError);
            expect(mockHeliusRpc.getAssetsByOwner).not.toHaveBeenCalled();
        });
    });
}); 