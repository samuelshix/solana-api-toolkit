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
| [`@solana-api-toolkit/token-data-service`](https://github.com/samuelshix/solana-api-toolkit/tree/master/packages/token-service) | Combined service for token data from multiple sources |
| [`@solana-api-toolkit/core`](https://github.com/samuelshix/solana-api-toolkit/tree/master/packages/core) | Shared utilities and types |


## Included API clients (api keys not included)
- Helius DAS API
- Birdeye
- Jupiter
- Coingecko

## Installation
```bash
npm install @solana-api-toolkit/core
npm install @solana-api-toolkit/token-data-service
```

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

## TODO:
- add coingecko support for token prices (including mapping token CA to coingecko ID)
