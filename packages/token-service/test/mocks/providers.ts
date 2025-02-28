import { TokenInfo, TokenBalance, WalletPortfolio } from '@solana-api-toolkit/core';
import { TokenDataProvider, TokenPrice } from '../../src/types';

/**
 * Mock token data provider for testing
 */
export class MockTokenDataProvider implements TokenDataProvider {
    readonly name: string;
    readonly priority: number;

    private mockTokenPrice: TokenPrice | null = null;
    private mockTokenMetadata: TokenInfo | null = null;
    private mockTokenBalances: TokenBalance[] | null = null;
    private mockWalletPortfolio: WalletPortfolio | null = null;

    private shouldThrowOnGetTokenPrice = false;
    private shouldThrowOnGetTokenMetadata = false;
    private shouldThrowOnGetTokenBalances = false;
    private shouldThrowOnGetWalletPortfolio = false;

    constructor(name: string = 'MockProvider', priority: number = 1) {
        this.name = name;
        this.priority = priority;
    }

    // Methods to set mock responses
    setMockTokenPrice(price: TokenPrice | null): void {
        this.mockTokenPrice = price;
    }

    setMockTokenMetadata(metadata: TokenInfo | null): void {
        this.mockTokenMetadata = metadata;
    }

    setMockTokenBalances(balances: TokenBalance[] | null): void {
        this.mockTokenBalances = balances;
    }

    setMockWalletPortfolio(portfolio: WalletPortfolio | null): void {
        this.mockWalletPortfolio = portfolio;
    }

    // Methods to control error behavior
    setShouldThrowOnGetTokenPrice(shouldThrow: boolean): void {
        this.shouldThrowOnGetTokenPrice = shouldThrow;
    }

    setShouldThrowOnGetTokenMetadata(shouldThrow: boolean): void {
        this.shouldThrowOnGetTokenMetadata = shouldThrow;
    }

    setShouldThrowOnGetTokenBalances(shouldThrow: boolean): void {
        this.shouldThrowOnGetTokenBalances = shouldThrow;
    }

    setShouldThrowOnGetWalletPortfolio(shouldThrow: boolean): void {
        this.shouldThrowOnGetWalletPortfolio = shouldThrow;
    }

    // Provider interface methods
    async getTokenPrice(mint: string): Promise<TokenPrice> {
        if (this.shouldThrowOnGetTokenPrice) {
            throw new Error(`${this.name} mock error: Failed to get token price for ${mint}`);
        }

        if (!this.mockTokenPrice) {
            throw new Error(`${this.name} mock error: No mock token price set`);
        }

        return {
            ...this.mockTokenPrice,
            mint
        };
    }

    async getTokenMetadata(mint: string): Promise<TokenInfo> {
        if (this.shouldThrowOnGetTokenMetadata) {
            throw new Error(`${this.name} mock error: Failed to get token metadata for ${mint}`);
        }

        if (!this.mockTokenMetadata) {
            throw new Error(`${this.name} mock error: No mock token metadata set`);
        }

        return {
            ...this.mockTokenMetadata,
            mint
        };
    }

    async getTokenBalances(address: string): Promise<TokenBalance[]> {
        if (this.shouldThrowOnGetTokenBalances) {
            throw new Error(`${this.name} mock error: Failed to get token balances for ${address}`);
        }

        if (!this.mockTokenBalances) {
            throw new Error(`${this.name} mock error: No mock token balances set`);
        }

        return this.mockTokenBalances;
    }

    async getWalletPortfolio(address: string): Promise<WalletPortfolio> {
        if (this.shouldThrowOnGetWalletPortfolio) {
            throw new Error(`${this.name} mock error: Failed to get wallet portfolio for ${address}`);
        }

        if (!this.mockWalletPortfolio) {
            throw new Error(`${this.name} mock error: No mock wallet portfolio set`);
        }

        return {
            ...this.mockWalletPortfolio,
            address
        };
    }
} 