# Solana API Toolkit

A comprehensive toolkit for interacting with Solana ecosystem APIs, providing standardized interfaces, error handling, and data normalization.

## Features

- 🔄 **Standardized Interfaces**: Consistent API patterns across different services
- 🛡️ **Robust Error Handling**: Detailed error information and recovery strategies
- 🚦 **Rate Limiting**: Built-in rate limit handling with configurable backoff
- 💾 **Caching**: Flexible caching strategies to minimize API calls
- 📊 **Data Normalization**: Consistent data structures across different APIs

## Packages

| Package | Description |
|---------|-------------|
| `@solana-api-toolkit/helius-client` | Client for Helius API (token balances, NFTs) |
| `@solana-api-toolkit/birdeye-client` | Client for Birdeye API (token prices, market data) |
| `@solana-api-toolkit/jupiter-client` | Client for Jupiter API (token metadata, swap quotes) |
| `@solana-api-toolkit/token-data-service` | Combined service for token data from multiple sources |
| `@solana-api-toolkit/core` | Shared utilities and types |

## Installation


## TODO:
- add coingecko support for token prices (including mapping token CA to coingecko ID)


## Development
For local development before publishing, use npm link:
### In packages/core

```bash
npm link
```

### In packages that depend on core

```bash
npm link @solana-api-toolkit/core
```