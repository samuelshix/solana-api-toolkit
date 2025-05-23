import axios from 'axios';
import { HttpClient, CircuitBreaker } from '../../src/http';
import {
    ApiRequestError,
    RateLimitError,
    AuthenticationError,
    NotFoundError
} from '../../src/errors';

// Mock axios and p-retry
jest.mock('axios', () => {
    return {
        create: jest.fn(() => ({
            request: jest.fn()
        })),
        isAxiosError: jest.fn()
    };
});

jest.mock('p-retry', () => {
    return jest.fn(async (fn) => {
        try {
            return await fn();
        } catch (error) {
            throw error;
        }
    });
});

describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second timeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should allow requests when closed', () => {
        expect(circuitBreaker.canRequest()).toBe(true);
    });

    it('should record success and reset failures', () => {
        // Record some failures
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();

        // Record success
        circuitBreaker.recordSuccess();

        // Record another failure
        const isOpen = circuitBreaker.recordFailure();

        // Should not be open after just one failure
        expect(isOpen).toBe(false);
        expect(circuitBreaker.canRequest()).toBe(true);
    });

    it('should open after threshold failures', () => {
        // Record failures up to threshold
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();
        const isOpen = circuitBreaker.recordFailure(); // Third failure

        expect(isOpen).toBe(true);
        expect(circuitBreaker.canRequest()).toBe(false);
    });

    it('should reset after timeout', () => {
        // Open the circuit
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();

        expect(circuitBreaker.canRequest()).toBe(false);

        // Advance time past the timeout
        jest.advanceTimersByTime(1001);

        // Should be able to request again
        expect(circuitBreaker.canRequest()).toBe(true);
    });
});

describe('HttpClient', () => {
    // Create a test subclass since HttpClient has protected methods
    class TestHttpClient extends HttpClient {
        public async testGet<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
            return this.get<T>(endpoint, params, headers);
        }

        public async testRequest<T>(method: string, endpoint: string, options: any = {}): Promise<T> {
            return this.request<T>(method, endpoint, options);
        }

        // Expose the circuit breaker for testing
        public getCircuitBreaker(): CircuitBreaker {
            return (this as any).circuitBreaker;
        }

        // Expose the handleAxiosError method for testing
        public handleAxiosErrorTest(error: any, endpoint: string): void {
            try {
                (this as any).handleAxiosError(error, endpoint);
            } catch (e) {
                throw e;
            }
        }
    }

    let httpClient: TestHttpClient;
    let mockAxiosCreate: jest.Mock;
    let mockAxiosRequest: jest.Mock;
    let mockIsAxiosError: jest.Mock<any, any>;

    beforeEach(() => {
        // Reset mocks
        mockAxiosRequest = jest.fn();
        mockAxiosCreate = axios.create as jest.Mock;
        mockAxiosCreate.mockReturnValue({ request: mockAxiosRequest });
        mockIsAxiosError = axios.isAxiosError as unknown as jest.Mock<any, any>;

        // Create a new client for each test
        httpClient = new TestHttpClient({
            apiKey: 'test-api-key',
            baseUrl: 'https://api.example.com',
            timeout: 5000,
            maxRetries: 2
        });
    });

    it('should initialize with the correct configuration', () => {
        expect(mockAxiosCreate).toHaveBeenCalledWith({
            baseURL: 'https://api.example.com',
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-api-key'
            }
        });
    });

    it('should make a successful GET request', async () => {
        const mockResponse = { data: { id: 1, name: 'Test' } };
        mockAxiosRequest.mockResolvedValueOnce(mockResponse);

        const result = await httpClient.testGet('/test');

        expect(mockAxiosRequest).toHaveBeenCalledWith({
            method: 'GET',
            url: '/test',
            params: undefined,
            headers: undefined
        });

        expect(result).toBe(mockResponse.data);
    });

    it('should make a GET request with params and headers', async () => {
        const mockResponse = { data: { id: 1, name: 'Test' } };
        mockAxiosRequest.mockResolvedValueOnce(mockResponse);

        const result = await httpClient.testGet('/test', { page: 1 }, { 'X-Custom': 'value' });

        expect(mockAxiosRequest).toHaveBeenCalledWith({
            method: 'GET',
            url: '/test',
            params: { page: 1 },
            headers: { 'X-Custom': 'value' }
        });

        expect(result).toBe(mockResponse.data);
    });

    it('should handle rate limit errors', async () => {
        const mockError = {
            response: {
                status: 429,
                headers: {
                    'retry-after': '30'
                }
            }
        };

        mockIsAxiosError.mockReturnValueOnce(true);

        expect(() => {
            httpClient.handleAxiosErrorTest(mockError, '/test');
        }).toThrow(RateLimitError);
    });

    it('should handle authentication errors', async () => {
        const mockError = {
            response: {
                status: 401
            }
        };

        mockIsAxiosError.mockReturnValueOnce(true);

        expect(() => {
            httpClient.handleAxiosErrorTest(mockError, '/test');
        }).toThrow(AuthenticationError);
    });

    it('should handle not found errors', async () => {
        const mockError = {
            response: {
                status: 404
            }
        };

        mockIsAxiosError.mockReturnValueOnce(true);

        expect(() => {
            httpClient.handleAxiosErrorTest(mockError, '/test');
        }).toThrow(NotFoundError);
    });

    it('should handle other API errors', async () => {
        const mockError = {
            response: {
                status: 500,
                data: {
                    message: 'Internal server error'
                }
            }
        };

        mockIsAxiosError.mockReturnValueOnce(true);

        expect(() => {
            httpClient.handleAxiosErrorTest(mockError, '/test');
        }).toThrow(ApiRequestError);
    });

    it('should handle non-axios errors', async () => {
        const mockError = new Error('Network error');

        mockIsAxiosError.mockReturnValueOnce(false);
        mockAxiosRequest.mockRejectedValueOnce(mockError);

        await expect(httpClient.testGet('/test')).rejects.toThrow(ApiRequestError);
    });

    it('should throw an error when circuit breaker is open', async () => {
        // Open the circuit breaker
        const circuitBreaker = httpClient.getCircuitBreaker();
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();

        await expect(httpClient.testGet('/test')).rejects.toThrow(ApiRequestError);

        // Axios request should not have been called
        expect(mockAxiosRequest).not.toHaveBeenCalled();
    });
}); 