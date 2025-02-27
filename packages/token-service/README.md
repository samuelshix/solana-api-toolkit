# @solana-api-toolkit/token-service

A powerful and flexible token data service for Solana with multi-provider support, automatic fallbacks, and caching.

[![npm version](https://img.shields.io/npm/v/@solana-api-toolkit/token-service.svg)](https://www.npmjs.com/package/@solana-api-toolkit/token-service)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Multi-Provider Support**: Seamlessly integrates with multiple token data providers including Helius, Jupiter, Birdeye, Solscan, CoinMarketCap, CoinGecko, and Pyth
- **Automatic Fallbacks**: Gracefully falls back to alternative providers if a primary provider fails
- **Intelligent Caching**: Reduces API calls and improves performance with configurable TTL caching
- **Comprehensive Token Data**: Access token prices, metadata, balances, and wallet portfolios
- **Type-Safe**: Written in TypeScript with full type definitions
- **Error Handling**: Robust error handling with detailed error messages
- **Circuit Breaker Pattern**: Prevents cascading failures with built-in circuit breaker

## Installation

```bash
npm install @solana-api-toolkit/token-service
```

## Usage

### Basic Usage

```typescript
import { TokenService } from '@solana-api-toolkit/token-service';

// Initialize with your API keys
const tokenService = new TokenService({
  jupiter: { apiKey: 'YOUR_JUPITER_API_KEY' },
  birdeye: { apiKey: 'YOUR_BIRDEYE_API_KEY' },
  // Add other providers as needed
});

// Get token price
const price = await tokenService.getTokenPrice('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
console.log(`USDC price: $${price.priceUsd}`);

// Get token metadata
const metadata = await tokenService.getTokenMetadata('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
console.log(`Token: ${metadata.name} (${metadata.symbol})`);

// Get wallet portfolio
const portfolio = await tokenService.getWalletPortfolio('YOUR_WALLET_ADDRESS');
console.log(`Total portfolio value: $${portfolio.totalValueUsd}`);
```

### Advanced Configuration

```typescript
import { TokenService } from '@solana-api-toolkit/token-service';

const tokenService = new TokenService({
  // Configure multiple providers with different priorities
  heliusDas: { 
    apiKey: 'YOUR_HELIUS_API_KEY',
    priority: 1, // Highest priority
    maxRetries: 3,
    timeout: 5000
  },
  jupiter: { 
    apiKey: 'YOUR_JUPITER_API_KEY',
    priority: 2,
    maxRetries: 2
  },
  birdeye: { 
    apiKey: 'YOUR_BIRDEYE_API_KEY',
    priority: 3
  },
  // Configure cache TTL
  cacheTtl: 10 * 60 * 1000 // 10 minutes
});

// Get comprehensive token data (metadata + price)
const tokenData = await tokenService.getTokenData('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
console.log(tokenData);
```

## API Reference

### `TokenService`

The main class for interacting with token data.

#### Constructor

```typescript
constructor(config: TokenServiceConfig = {})
```

#### Configuration Options

The `TokenServiceConfig` interface supports the following providers:

- `helius`: Helius provider configuration
- `heliusDas`: Helius DAS provider configuration
- `jupiter`: Jupiter provider configuration
- `birdeye`: Birdeye provider configuration
- `solscan`: Solscan provider configuration
- `coinmarketcap`: CoinMarketCap provider configuration
- `coingecko`: CoinGecko provider configuration
- `pyth`: Pyth provider configuration

Each provider configuration accepts:

- `apiKey`: API key for the provider (required)
- `baseUrl`: Custom base URL (optional)
- `timeout`: Request timeout in milliseconds (optional)
- `maxRetries`: Maximum number of retry attempts (optional)
- `priority`: Provider priority (lower is higher priority) (optional)
- `cacheTtl`: Cache TTL in milliseconds (optional)

#### Methods

- **`getTokenPrice(mint: string): Promise<TokenPrice>`**  
  Get token price with automatic fallback between providers.

- **`getTokenMetadata(mint: string): Promise<TokenInfo>`**  
  Get token metadata with automatic fallback between providers.

- **`getTokenBalances(address: string): Promise<TokenBalance[]>`**  
  Get token balances for a wallet with automatic fallback between providers.

- **`getWalletPortfolio(address: string): Promise<WalletPortfolio>`**  
  Get wallet portfolio with automatic fallback between providers. Enriches with price data when available.

- **`getTokenData(mint: string): Promise<TokenInfo>`**  
  Get comprehensive token data combining metadata and price.

## Why Use This Package?

- **Reliability**: Never worry about API downtime with automatic provider fallbacks
- **Simplicity**: One unified API for multiple token data sources
- **Performance**: Built-in caching reduces API calls and improves response times
- **Flexibility**: Configure multiple providers to suit your needs and budget
- **Comprehensive**: Get all the token data you need in one place

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 