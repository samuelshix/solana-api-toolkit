import {
    ApiToolkitError,
    ApiRequestError,
    RateLimitError,
    AuthenticationError,
    NotFoundError,
    ValidationError
} from '../../src/errors';

describe('ApiToolkitError', () => {
    it('should create an error with the correct name and message', () => {
        const error = new ApiToolkitError('Test error message');

        expect(error.name).toBe('ApiToolkitError');
        expect(error.message).toBe('Test error message');
        expect(error instanceof Error).toBe(true);
    });
});

describe('ApiRequestError', () => {
    it('should create an error with the correct name, message, endpoint, and status code', () => {
        const error = new ApiRequestError('Test error message', '/api/test', 400);

        expect(error.name).toBe('ApiRequestError');
        expect(error.message).toBe('API Request Error (/api/test): Test error message');
        expect(error.endpoint).toBe('/api/test');
        expect(error.statusCode).toBe(400);
        expect(error instanceof ApiToolkitError).toBe(true);
    });

    it('should create an error without status code', () => {
        const error = new ApiRequestError('Test error message', '/api/test');

        expect(error.name).toBe('ApiRequestError');
        expect(error.message).toBe('API Request Error (/api/test): Test error message');
        expect(error.endpoint).toBe('/api/test');
        expect(error.statusCode).toBeUndefined();
        expect(error instanceof ApiToolkitError).toBe(true);
    });
});

describe('RateLimitError', () => {
    it('should create an error with the correct name, message, endpoint, status code, and retry after', () => {
        const error = new RateLimitError('/api/test', 60);

        expect(error.name).toBe('RateLimitError');
        expect(error.message).toBe('API Request Error (/api/test): Rate limit exceeded');
        expect(error.endpoint).toBe('/api/test');
        expect(error.statusCode).toBe(429);
        expect(error.retryAfter).toBe(60);
        expect(error instanceof ApiRequestError).toBe(true);
    });

    it('should create an error without retry after', () => {
        const error = new RateLimitError('/api/test');

        expect(error.name).toBe('RateLimitError');
        expect(error.message).toBe('API Request Error (/api/test): Rate limit exceeded');
        expect(error.endpoint).toBe('/api/test');
        expect(error.statusCode).toBe(429);
        expect(error.retryAfter).toBeUndefined();
        expect(error instanceof ApiRequestError).toBe(true);
    });
});

describe('AuthenticationError', () => {
    it('should create an error with the correct name, message, endpoint, and status code', () => {
        const error = new AuthenticationError('/api/test');

        expect(error.name).toBe('AuthenticationError');
        expect(error.message).toBe('API Request Error (/api/test): Authentication failed');
        expect(error.endpoint).toBe('/api/test');
        expect(error.statusCode).toBe(401);
        expect(error instanceof ApiRequestError).toBe(true);
    });
});

describe('NotFoundError', () => {
    it('should create an error with the correct name, message, endpoint, and status code', () => {
        const error = new NotFoundError('User', '/api/users/123');

        expect(error.name).toBe('NotFoundError');
        expect(error.message).toBe('API Request Error (/api/users/123): Resource not found: User');
        expect(error.endpoint).toBe('/api/users/123');
        expect(error.statusCode).toBe(404);
        expect(error instanceof ApiRequestError).toBe(true);
    });
});

describe('ValidationError', () => {
    it('should create an error with the correct name, message, and field', () => {
        const error = new ValidationError('Invalid email format', 'email');

        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Validation Error (email): Invalid email format');
        expect(error.field).toBe('email');
        expect(error instanceof ApiToolkitError).toBe(true);
    });

    it('should create an error without field', () => {
        const error = new ValidationError('Invalid input');

        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Validation Error: Invalid input');
        expect(error.field).toBeUndefined();
        expect(error instanceof ApiToolkitError).toBe(true);
    });
}); 