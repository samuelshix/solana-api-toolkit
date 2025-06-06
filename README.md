# Solana API Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/%40solana-api-toolkit%2Fcore.svg)](https://badge.fury.io/js/%40solana-api-toolkit%2Fcore)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A toolkit for interacting with Solana blockchain APIs, providing a unified interface for token data, prices, and metadata.

## Features

- Token price data from multiple providers
- Token metadata retrieval
- Wallet portfolio tracking
- Unified API interface
- TypeScript support
- Extensible provider system

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
npm install @solana-api-toolkit/core @solana-api-toolkit/token-service
```

## Quick Start

```typescript
import { TokenService } from '@solana-api-toolkit/token-service';

const tokenService = new TokenService({
  helius: {
    apiKey: 'your-helius-api-key'
  }
});

// Get token price
const price = await tokenService.getTokenPrice('mint-address');

// Get token metadata
const metadata = await tokenService.getTokenMetadata('mint-address');
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for development setup and workflow details.

## Publishing

Please see the packages PUBLISHING.md for publishing to npm.
## Project Structure

```
solana-api-toolkit/
├── packages/
│   ├── core/           # Core functionality
│   └── token-service/  # Token-related services
├── docs/              # Documentation
├── .github/           # GitHub templates and workflows
├── CONTRIBUTING.md    # Contributing guidelines
├── LICENSE           # MIT License
└── README.md         # This file
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## TODO:
- add coingecko support for token prices (including mapping token CA to coingecko ID)
