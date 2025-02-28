// Mock p-retry before importing HttpClient
jest.mock('p-retry', () => {
    return jest.fn(async (fn) => {
        try {
            return await fn();
        } catch (error) {
            throw error;
        }
    });
});

import { HttpClient } from '../../src/http';

describe('HttpClient Integration Tests', () => {
    // Create a test subclass since HttpClient has protected methods
    class TestHttpClient extends HttpClient {
        public async testGet<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
            return this.get<T>(endpoint, params, headers);
        }
    }

    let httpClient: TestHttpClient;

    beforeEach(() => {
        // Create a new client for each test
        httpClient = new TestHttpClient({
            apiKey: 'test-api-key',
            baseUrl: 'https://api.example.com',
            timeout: 5000,
            maxRetries: 2
        });
    });

    it('should create an HttpClient instance', async () => {

        const response = await httpClient.testGet('https://api.example.com/test', {}, {});

        expect(response).toBeInstanceOf(HttpClient);
    });
}); 