# Contributing to Solana API Toolkit

This guide explains how to set up your development environment and contribute to the Solana API Toolkit packages.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/samuelshix/solana-api-toolkit.git
cd solana-api-toolkit
```

2. Install dependencies:
```bash
npm install
```

## Local Development

### Working with Local Package Dependencies

When working on packages that depend on each other (e.g., token-service depends on core), you have two options:

#### Option 1: Using npm link (Recommended)
```bash
# In packages/core
cd packages/core
npm run build
npm link

# In packages/token-service
cd ../token-service
npm link @solana-api-toolkit/core
```

#### Option 2: Using Local File References
In the dependent package's package.json, temporarily update the dependency:
```json
{
  "dependencies": {
    "@solana-api-toolkit/core": "file:../core"
  }
}
```
Remember to change this back to the published version before committing.

### Development Commands

From the root directory:
```bash
# Build all packages
npm run build

# Run tests for all packages
npm run test

# Run tests for a specific package
cd packages/token-service
npm run test

# Run linting
npm run lint

# Clean build artifacts
npm run clean
```

### Development Workflow

1. Make your changes in the relevant package(s)
2. Run tests to ensure nothing is broken:
   ```bash
   npm run test
   ```
3. Build the packages:
   ```bash
   npm run build
   ```
4. Test the integration between packages if needed
5. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/) format

## Publishing

Each package has its own `PUBLISHING.md` with specific instructions for publishing that package. Make sure to follow those guidelines when publishing new versions.

## Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Add tests for new functionality
- Update documentation as needed