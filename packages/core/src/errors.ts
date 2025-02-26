/**
 * Base error class for all API toolkit errors
 */
export class ApiToolkitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ApiToolkitError';
    }
}

/**
 * Error thrown when API request fails
 */
export class ApiRequestError extends ApiToolkitError {
    statusCode?: number;
    endpoint: string;

    constructor(message: string, endpoint: string, statusCode?: number) {
        super(`API Request Error (${endpoint}): ${message}`);
        this.name = 'ApiRequestError';
        this.endpoint = endpoint;
        this.statusCode = statusCode;
    }
}

/**
 * Error thrown when API rate limit is exceeded
 */
export class RateLimitError extends ApiRequestError {
    retryAfter?: number;

    constructor(endpoint: string, retryAfter?: number) {
        super('Rate limit exceeded', endpoint, 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/**
 * Error thrown when API authentication fails
 */
export class AuthenticationError extends ApiRequestError {
    constructor(endpoint: string) {
        super('Authentication failed', endpoint, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends ApiRequestError {
    constructor(resource: string, endpoint: string) {
        super(`Resource not found: ${resource}`, endpoint, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends ApiToolkitError {
    field?: string;

    constructor(message: string, field?: string) {
        super(`Validation Error${field ? ` (${field})` : ''}: ${message}`);
        this.name = 'ValidationError';
        this.field = field;
    }
} 