import {
    HttpClient,
    ApiClientConfig,
    TokenBalance,
    WalletPortfolio,
    ValidationError,
    SimpleCache,
    isValidSolanaAddress
} from '@solana-api-toolkit/core';
import { PublicKey } from '@solana/web3.js';
import {
    HeliusConfig,
    HeliusTokenBalance,
    HeliusTokenMetadata,
    HeliusNft,
    HeliusTransactionParams
} from './types';

/**
 * Client for interacting with the Helius API
 */
export class HeliusClient extends HttpClient {
    private cache: SimpleCache<any>;
    private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(config: HeliusConfig) {
        super({
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://api.helius.xyz/v0',
            timeout: config.timeout,
            maxRetries: config.maxRetries
        });

        this.cache = new SimpleCache<any>();
    }

    /**
     * Get token balances for a wallet
     * @param address Wallet address
     * @returns Array of token balances
     */
    async getTokenBalances(address: string): Promise<TokenBalance[]> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid Solana address', 'address');
        }

        const cacheKey = `token-balances:${address}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const response = await this.get<HeliusTokenBalance[]>(`/addresses/${address}/balances`);

        const tokenBalances: TokenBalance[] = response.map(token => ({
            mint: token.mint,
            amount: token.amount,
            uiAmount: token.uiAmount,
            tokenInfo: {
                mint: token.mint,
                symbol: '', // Will be populated with metadata
                name: '',  // Will be populated with metadata
                decimals: token.decimals
            }
        }));

        // Fetch metadata for tokens
        if (tokenBalances.length > 0) {
            await this.enrichTokensWithMetadata(tokenBalances);
        }

        this.cache.set(cacheKey, tokenBalances, this.DEFAULT_CACHE_TTL);
        return tokenBalances;
    }

    /**
     * Get wallet portfolio including SOL balance and tokens
     * @param address Wallet address
     * @returns Wallet portfolio information
     */
    async getWalletPortfolio(address: string): Promise<WalletPortfolio> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid Solana address', 'address');
        }

        const cacheKey = `wallet-portfolio:${address}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const [balanceResponse, tokens] = await Promise.all([
            this.get<{ lamports: number }>(`/addresses/${address}/balance`),
            this.getTokenBalances(address)
        ]);

        const solBalance = balanceResponse.lamports / 1e9;

        const portfolio: WalletPortfolio = {
            address,
            solBalance,
            tokens,
            // Total value calculation would require price data
        };

        this.cache.set(cacheKey, portfolio, this.DEFAULT_CACHE_TTL);
        return portfolio;
    }

    /**
     * Get token metadata
     * @param mint Token mint address
     * @returns Token metadata
     */
    async getTokenMetadata(mint: string): Promise<HeliusTokenMetadata> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid token mint address', 'mint');
        }

        const cacheKey = `token-metadata:${mint}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const response = await this.get<HeliusTokenMetadata>(`/tokens/${mint}/metadata`);

        this.cache.set(cacheKey, response, this.DEFAULT_CACHE_TTL);
        return response;
    }

    /**
     * Get NFT metadata
     * @param mint NFT mint address
     * @returns NFT metadata
     */
    async getNftMetadata(mint: string): Promise<HeliusNft> {
        if (!isValidSolanaAddress(mint)) {
            throw new ValidationError('Invalid NFT mint address', 'mint');
        }

        const cacheKey = `nft-metadata:${mint}`;
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const response = await this.get<HeliusNft>(`/nfts/${mint}/metadata`);

        this.cache.set(cacheKey, response, this.DEFAULT_CACHE_TTL);
        return response;
    }

    /**
     * Get transactions for a wallet
     * @param address Wallet address
     * @param params Transaction query parameters
     * @returns Array of transactions
     */
    async getTransactions(address: string, params?: HeliusTransactionParams): Promise<any[]> {
        if (!isValidSolanaAddress(address)) {
            throw new ValidationError('Invalid Solana address', 'address');
        }

        const response = await this.get<any[]>(`/addresses/${address}/transactions`, params);
        return response;
    }

    /**
     * Enrich token balances with metadata
     * @param tokens Array of token balances
     */
    private async enrichTokensWithMetadata(tokens: TokenBalance[]): Promise<void> {
        const metadataPromises = tokens.map(async (token) => {
            try {
                const metadata = await this.getTokenMetadata(token.mint);
                if (token.tokenInfo) {
                    token.tokenInfo.name = metadata.name;
                    token.tokenInfo.symbol = metadata.symbol;
                    token.tokenInfo.decimals = metadata.decimals;
                }
            } catch (error) {
                // Ignore metadata errors, keep the token without metadata
                console.warn(`Failed to fetch metadata for token ${token.mint}: ${error.message}`);
            }
        });

        await Promise.all(metadataPromises);
    }
} 