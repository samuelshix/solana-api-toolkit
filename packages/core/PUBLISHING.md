# Publishing @solana-api-toolkit/core to npm

This guide explains how to publish the core package to npm.

## Prerequisites

1. You need an npm account. If you don't have one, create it at [npmjs.com](https://www.npmjs.com/signup).
2. You need to be logged in to npm in your terminal. Run `npm login` and follow the prompts.
3. You need to either:
   - Have permission to publish to this scope
   - Create your own scope (e.g., `@your-username`)

## Preparing the Package

1. Update the package.json file:

```json
{
  "name": "@solana-api-toolkit/core",
  "version": "0.1.0",
  "description": "Core utilities and interfaces for Solana API Toolkit",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

2. Build the package:
```bash
npm run build
```

3. Test the package locally (optional):
```bash
npm pack
```
This will create a `.tgz` file that you can install in another project to test.

## Publishing the Package

1. If this is your first time publishing this package, run:
```bash
npm publish --access public
```

2. For subsequent updates, first update the version in package.json using one of these commands:
```bash
# For a patch update (bug fixes)
npm version patch

# For a minor update (new features, backward compatible)
npm version minor

# For a major update (breaking changes)
npm version major
```

3. Then publish the updated package:
```bash
npm publish
```

## Publishing from a Monorepo

If you're working in a monorepo (which appears to be the case), you might want to use a tool like Lerna or npm workspaces to manage publishing multiple packages.

### Using npm Workspaces

1. Make sure your root package.json has workspaces configured:
```json
{
  "name": "solana-api-toolkit",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

2. To publish a single package from the workspace:
```bash
cd packages/core
npm publish --access public
```

### Using Lerna (Alternative)

1. Install Lerna globally:
```bash
npm install -g lerna
```

2. Initialize Lerna in your project (if not already done):
```bash
lerna init
```

3. Publish packages:
```bash
# Publish all changed packages
lerna publish

# Publish a specific package
lerna publish --scope=@solana-api-toolkit/core
```

## After Publishing

1. Create a git tag for the release:
```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

2. Update any documentation or examples to reference the new package version.

3. If you have a changelog, update it with the changes in this release.

## Troubleshooting

- **"You must be logged in to publish packages"**: Run `npm login` and try again.
- **"You do not have permission to publish"**: Check if you have the right permissions for the scope or consider using your own scope.
- **"Package name already exists"**: Choose a different package name or scope.
- **"Version already exists"**: Update the version number in package.json.