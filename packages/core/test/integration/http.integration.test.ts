import nock from 'nock';
import { HttpClient } from '../../src/http';
import {
    ApiRequestError,
    RateLimitError,
    AuthenticationError,
    NotFoundError
} from '../../src/errors';

// Create a test subclass since HttpClient has protected methods
class TestHttpClient extends HttpClient {
    public async testGet<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
        return this.get<T>(endpoint, params, headers);
    }
}

describe('HttpClient Integration Tests', () => {
    const baseUrl = 'https://api.example.com';
    let httpClient: TestHttpClient;

    beforeAll(() => {
        // Disable real HTTP requests
        nock.disableNetConnect();
    });

    afterAll(() => {
        // Enable real HTTP requests
        nock.enableNetConnect();
        nock.cleanAll();
    });

    beforeEach(() => {
        // Create a new client for each test
        httpClient = new TestHttpClient({
            apiKey: 'test-api-key',
            baseUrl,
            timeout: 5000,
            maxRetries: 2
        });

        // Clear all previous nock interceptors
        nock.cleanAll();
    });

    it('should make a successful GET request', async () => {
        const mockData = { id: 1, name: 'Test' };

        nock(baseUrl)
            .get('/test')
            .reply(200, mockData);

        const result = await httpClient.testGet('/test');

        expect(result).toEqual(mockData);
    });

    it('should make a GET request with query parameters', async () => {
        const mockData = { id: 1, name: 'Test' };

        nock(baseUrl)
            .get('/test')
            .query({ page: 1, limit: 10 })
            .reply(200, mockData);

        const result = await httpClient.testGet('/test', { page: 1, limit: 10 });

        expect(result).toEqual(mockData);
    });

    it('should make a GET request with custom headers', async () => {
        const mockData = { id: 1, name: 'Test' };

        nock(baseUrl)
            .get('/test')
            .matchHeader('X-Custom', 'value')
            .reply(200, mockData);

        const result = await httpClient.testGet('/test', undefined, { 'X-Custom': 'value' });

        expect(result).toEqual(mockData);
    });

    it('should handle rate limit errors', async () => {
        nock(baseUrl)
            .get('/test')
            .reply(429, { message: 'Rate limit exceeded' }, { 'Retry-After': '30' });

        await expect(httpClient.testGet('/test')).rejects.toThrow(RateLimitError);
        await expect(httpClient.testGet('/test')).rejects.toMatchObject({
            name: 'RateLimitError',
            statusCode: 429,
            retryAfter: 30
        });
    });

    it('should handle authentication errors', async () => {
        nock(baseUrl)
            .get('/test')
            .reply(401, { message: 'Unauthorized' });

        await expect(httpClient.testGet('/test')).rejects.toThrow(AuthenticationError);
        await expect(httpClient.testGet('/test')).rejects.toMatchObject({
            name: 'AuthenticationError',
            statusCode: 401
        });
    });

    it('should handle not found errors', async () => {
        nock(baseUrl)
            .get('/test')
            .reply(404, { message: 'Not found' });

        await expect(httpClient.testGet('/test')).rejects.toThrow(NotFoundError);
        await expect(httpClient.testGet('/test')).rejects.toMatchObject({
            name: 'NotFoundError',
            statusCode: 404
        });
    });

    it('should handle server errors', async () => {
        nock(baseUrl)
            .get('/test')
            .reply(500, { message: 'Internal server error' });

        await expect(httpClient.testGet('/test')).rejects.toThrow(ApiRequestError);
        await expect(httpClient.testGet('/test')).rejects.toMatchObject({
            name: 'ApiRequestError',
            statusCode: 500,
            message: expect.stringContaining('Internal server error')
        });
    });

    it('should retry failed requests and succeed on retry', async () => {
        // First request fails with 500, second succeeds
        nock(baseUrl)
            .get('/test')
            .reply(500, { message: 'Internal server error' })
            .get('/test')
            .reply(200, { id: 1, name: 'Test' });

        const result = await httpClient.testGet('/test');

        expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should retry failed requests and fail after max retries', async () => {
        // All requests fail with 500
        nock(baseUrl)
            .get('/test')
            .reply(500, { message: 'Internal server error' })
            .get('/test')
            .reply(500, { message: 'Internal server error' })
            .get('/test')
            .reply(500, { message: 'Internal server error' });

        await expect(httpClient.testGet('/test')).rejects.toThrow(ApiRequestError);
        await expect(httpClient.testGet('/test')).rejects.toMatchObject({
            name: 'ApiRequestError',
            statusCode: 500
        });
    });

    it('should handle network errors', async () => {
        nock(baseUrl)
            .get('/test')
            .replyWithError('Network error');

        await expect(httpClient.testGet('/test')).rejects.toThrow(ApiRequestError);
        await expect(httpClient.testGet('/test')).rejects.toMatchObject({
            name: 'ApiRequestError',
            message: expect.stringContaining('Network error')
        });
    });
}); 