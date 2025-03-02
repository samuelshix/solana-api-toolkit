import * as fs from 'fs';
import * as path from 'path';

// Path to the CoinGecko JSON file
const filePath = path.join(__dirname, './coingeckoRaw.json');

// Read and parse the JSON file
const coingeckoData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Filter coins that have a Solana platform
const solanaCoins = coingeckoData.filter((coin: any) =>
    coin.platforms && 'solana' in coin.platforms
);

// Print the results
console.log(`Found ${solanaCoins.length} coins with Solana platforms`);

// Create a hashmap of CoinGecko ID to Solana token address
const idToAddressMap: Record<string, string> = {};

solanaCoins.forEach((coin: any) => {
    idToAddressMap[coin.platforms.solana] = coin.id;
});

// Optionally, save the filtered results to a new file
const outputPath = path.join(__dirname, './coingecko.json');
fs.writeFileSync(outputPath, JSON.stringify(idToAddressMap, null, 2), { mode: 0o644 });
console.log(`\nSaved filtered results to ${outputPath}`);