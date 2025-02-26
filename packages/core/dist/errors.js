"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.NotFoundError = exports.AuthenticationError = exports.RateLimitError = exports.ApiRequestError = exports.ApiToolkitError = void 0;
/**
 * Base error class for all API toolkit errors
 */
class ApiToolkitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ApiToolkitError';
    }
}
exports.ApiToolkitError = ApiToolkitError;
/**
 * Error thrown when API request fails
 */
class ApiRequestError extends ApiToolkitError {
    constructor(message, endpoint, statusCode) {
        super(`API Request Error (${endpoint}): ${message}`);
        this.name = 'ApiRequestError';
        this.endpoint = endpoint;
        this.statusCode = statusCode;
    }
}
exports.ApiRequestError = ApiRequestError;
/**
 * Error thrown when API rate limit is exceeded
 */
class RateLimitError extends ApiRequestError {
    constructor(endpoint, retryAfter) {
        super('Rate limit exceeded', endpoint, 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Error thrown when API authentication fails
 */
class AuthenticationError extends ApiRequestError {
    constructor(endpoint) {
        super('Authentication failed', endpoint, 401);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Error thrown when a resource is not found
 */
class NotFoundError extends ApiRequestError {
    constructor(resource, endpoint) {
        super(`Resource not found: ${resource}`, endpoint, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error thrown when input validation fails
 */
class ValidationError extends ApiToolkitError {
    constructor(message, field) {
        super(`Validation Error${field ? ` (${field})` : ''}: ${message}`);
        this.name = 'ValidationError';
        this.field = field;
    }
}
exports.ValidationError = ValidationError;
