/**
 * Base error class for all API toolkit errors
 */
export declare class ApiToolkitError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when API request fails
 */
export declare class ApiRequestError extends ApiToolkitError {
    statusCode?: number;
    endpoint: string;
    constructor(message: string, endpoint: string, statusCode?: number);
}
/**
 * Error thrown when API rate limit is exceeded
 */
export declare class RateLimitError extends ApiRequestError {
    retryAfter?: number;
    constructor(endpoint: string, retryAfter?: number);
}
/**
 * Error thrown when API authentication fails
 */
export declare class AuthenticationError extends ApiRequestError {
    constructor(endpoint: string);
}
/**
 * Error thrown when a resource is not found
 */
export declare class NotFoundError extends ApiRequestError {
    constructor(resource: string, endpoint: string);
}
/**
 * Error thrown when input validation fails
 */
export declare class ValidationError extends ApiToolkitError {
    field?: string;
    constructor(message: string, field?: string);
}
