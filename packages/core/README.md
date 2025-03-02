# Solana API Toolkit Core

Core utilities, interfaces, and shared functionality for the Solana API Toolkit ecosystem.

[![npm version](https://img.shields.io/npm/v/@solana-api-toolkit/core.svg)](https://www.npmjs.com/package/@solana-api-toolkit/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔄 **HTTP Client**: Robust HTTP client with retry logic, circuit breaker, and standardized error handling
- 🛡️ **Error Types**: Comprehensive error hierarchy for different API scenarios
- 🚦 **Rate Limiting**: Built-in rate limit handling with configurable backoff
- 💾 **Caching**: Simple and efficient caching implementation
- 🧩 **Common Types**: Shared type definitions used across the toolkit
- 🔍 **Validation**: Utilities for validating Solana addresses and other data

## Installation

```bash
npm install solana-api-toolkit-core
```

## Usage

```typescript
import { HttpClient, ApiClientConfig } from 'solana-api-toolkit-core';
// Create a client for a specific API
class MyApiClient extends HttpClient {
    constructor(config: ApiClientConfig) {
    super({
        baseUrl: 'https://api.example.com',
        ...config
    });
}
async getResource(id: string): Promise<any> {
        return this.get<any>(`/resources/${id}`);
    }
}
// Use the client
const client = new MyApiClient({ apiKey: 'your-api-key' });
const data = await client.getResource('123');
```

```typescript
import {
    ApiError,
    ApiRequestError,
    RateLimitError,
    AuthenticationError,
    NotFoundError,
    ValidationError
} from 'solana-api-toolkit-core';
try {
    // API call
} catch (error) {
    if (error instanceof RateLimitError) {
        console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    } else if (error instanceof AuthenticationError) {
        console.log('Authentication failed. Check your API key.');
    } else if (error instanceof NotFoundError) {
        console.log(`Resource not found: ${error.message}`);
    } else if (error instanceof ValidationError) {
        console.log(`Validation error for field ${error.field}: ${error.message}`);
    } else if (error instanceof ApiRequestError) {
        console.log(`API request failed: ${error.message}, Status: ${error.statusCode}`);
    }
}
```

```typescript
import { SimpleCache } from 'solana-api-toolkit-core';
const cache = new SimpleCache<any>();
// Set with TTL (time-to-live) in milliseconds
cache.set('key', data, 60000); // Cache for 1 minute
// Get (returns undefined if expired or not found)
const cachedData = cache.get('key');
// Check if exists
const exists = cache.has('key');
// Delete
cache.delete('key');
// Clear all
cache.clear();
```

```typescript
import { isValidSolanaAddress } from 'solana-api-toolkit-core';
if (isValidSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')) {
// Valid Solana address
}
```

```typescript
import { CircuitBreaker } from 'solana-api-toolkit-core';
// Create a circuit breaker with custom settings
const breaker = new CircuitBreaker(
5, // Threshold (number of failures before opening)
30000 // Reset timeout in milliseconds
);
// Record success/failure
breaker.recordSuccess();
breaker.recordFailure();
// Check if requests can be made
if (breaker.canRequest()) {
// Safe to make request
}
```

```typescript
import {
    ApiClientConfig,
    TokenInfo,
    TokenBalance,
    WalletPortfolio
} from 'solana-api-toolkit-core';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Please follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.

## Backlog
- [ ] Additional @solana-api-toolkit packages for other common API uses
