"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCache = void 0;
exports.isValidSolanaAddress = isValidSolanaAddress;
exports.formatNumber = formatNumber;
exports.lamportsToSol = lamportsToSol;
exports.tokenAmountToUiAmount = tokenAmountToUiAmount;
exports.uiAmountToTokenAmount = uiAmountToTokenAmount;
const web3_js_1 = require("@solana/web3.js");
/**
 * Validates if a string is a valid Solana address
 */
function isValidSolanaAddress(address) {
    try {
        new web3_js_1.PublicKey(address);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Simple in-memory cache implementation
 */
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }
    /**
     * Get a value from cache
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return undefined;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return undefined;
        }
        return item.value;
    }
    /**
     * Set a value in cache with TTL
     */
    set(key, value, ttlMs) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttlMs
        });
    }
    /**
     * Delete a value from cache
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
}
exports.SimpleCache = SimpleCache;
/**
 * Format a number to a fixed number of decimal places
 */
function formatNumber(num, decimals = 2) {
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
/**
 * Convert raw token amount to UI amount based on decimals
 */
function lamportsToSol(lamports) {
    return Number(lamports) / 1e9;
}
/**
 * Convert raw token amount to UI amount based on decimals
 */
function tokenAmountToUiAmount(amount, decimals) {
    return Number(amount) / Math.pow(10, decimals);
}
/**
 * Convert UI amount to raw token amount based on decimals
 */
function uiAmountToTokenAmount(amount, decimals) {
    return (amount * Math.pow(10, decimals)).toString();
}
