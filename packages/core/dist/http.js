"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.HttpClient = void 0;
const axios_1 = __importDefault(require("axios"));
const p_retry_1 = __importDefault(require("p-retry"));
const errors_1 = require("./errors");
/**
 * Base HTTP client with retry logic, error handling, and standardized responses
 */
class HttpClient {
    constructor(config) {
        this.circuitBreaker = new CircuitBreaker();
        this.config = {
            timeout: 30000,
            maxRetries: 3,
            ...config
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            }
        });
    }
    /**
     * Make an HTTP request with retry logic
     */
    async request(method, endpoint, options = {}) {
        if (!this.circuitBreaker.canRequest()) {
            throw new errors_1.ApiRequestError('Circuit breaker is open', endpoint);
        }
        const retryOptions = {
            retries: this.config.maxRetries,
            onRetry: (error, attempt) => {
                console.warn(`Retry attempt ${attempt} for ${endpoint}: ${error.message}`);
            }
        };
        try {
            const response = await (0, p_retry_1.default)(async () => {
                try {
                    const result = await this.client.request({
                        method,
                        url: endpoint,
                        ...options
                    });
                    this.circuitBreaker.recordSuccess();
                    return result.data;
                }
                catch (error) {
                    if (axios_1.default.isAxiosError(error)) {
                        this.handleAxiosError(error, endpoint);
                    }
                    throw error;
                }
            }, retryOptions);
            return response;
        }
        catch (error) {
            if (this.circuitBreaker.recordFailure()) {
                console.warn(`Circuit breaker opened for ${this.config.baseUrl}`);
            }
            if (axios_1.default.isAxiosError(error)) {
                this.handleAxiosError(error, endpoint);
            }
            // Handle unknown error type
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new errors_1.ApiRequestError(`Request failed: ${errorMessage}`, endpoint);
        }
    }
    /**
     * Handle Axios errors and convert them to specific error types
     */
    handleAxiosError(error, endpoint) {
        const status = error.response?.status;
        if (status === 429) {
            const retryAfter = parseInt(error.response?.headers['retry-after'] || '0', 10);
            throw new errors_1.RateLimitError(endpoint, retryAfter);
        }
        if (status === 401 || status === 403) {
            throw new errors_1.AuthenticationError(endpoint);
        }
        if (status === 404) {
            throw new errors_1.NotFoundError('Resource', endpoint);
        }
        throw new errors_1.ApiRequestError(error.response?.data?.message || error.message || 'Unknown error', endpoint, status);
    }
    // /**
    //  * Make a GET request
    //  */
    // protected async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    //     return this.request<T>('GET', endpoint, { params });
    // }
    // /**
    //  * Make a POST request
    //  */
    // protected async post<T>(endpoint: string, data?: any): Promise<T> {
    //     return this.request<T>('POST', endpoint, { data });
    // }
    // /**
    //  * Make a PUT request
    //  */
    // protected async put<T>(endpoint: string, data?: any): Promise<T> {
    //     return this.request<T>('PUT', endpoint, { data });
    // }
    // /**
    //  * Make a DELETE request
    //  */
    // protected async delete<T>(endpoint: string): Promise<T> {
    //     return this.request<T>('DELETE', endpoint);
    // }
    /**
     * Make a GET request with additional headers
     */
    get(endpoint, params, headers) {
        return this.request('GET', endpoint, {
            params,
            headers: headers ? { ...headers } : undefined
        });
    }
}
exports.HttpClient = HttpClient;
class CircuitBreaker {
    constructor(threshold = 5, resetTimeout = 30000) {
        this.threshold = threshold;
        this.resetTimeout = resetTimeout;
        this.failures = 0;
        this.lastFailureTime = 0;
        this.isOpen = false;
    }
    recordSuccess() {
        this.failures = 0;
        this.isOpen = false;
    }
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.isOpen = true;
        }
        return this.isOpen;
    }
    canRequest() {
        if (!this.isOpen)
            return true;
        // Check if circuit can be reset
        if (Date.now() - this.lastFailureTime > this.resetTimeout) {
            this.isOpen = false;
            return true;
        }
        return false;
    }
}
exports.CircuitBreaker = CircuitBreaker;
