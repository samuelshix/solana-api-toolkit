import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import pRetry from 'p-retry';
import { ApiClientConfig } from './types';
import {
    ApiRequestError,
    RateLimitError,
    AuthenticationError,
    NotFoundError
} from './errors';

/**
 * Base HTTP client with retry logic, error handling, and standardized responses
 */
export class HttpClient {
    protected client: AxiosInstance;
    protected config: ApiClientConfig;
    private circuitBreaker = new CircuitBreaker();

    constructor(config: ApiClientConfig) {
        this.config = {
            timeout: 30000,
            maxRetries: 3,
            ...config
        };

        this.client = axios.create({
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
    protected async request<T>(
        method: string,
        endpoint: string,
        options: AxiosRequestConfig = {}
    ): Promise<T> {
        if (!this.circuitBreaker.canRequest()) {
            throw new ApiRequestError('Circuit breaker is open', endpoint);
        }

        const retryOptions = {
            retries: this.config.maxRetries,
            onRetry: (error: Error, attempt: number) => {
                console.warn(`Retry attempt ${attempt} for ${endpoint}: ${error.message}`);
            }
        };

        try {
            const response = await pRetry(async () => {
                try {
                    const result = await this.client.request<T>({
                        method,
                        url: endpoint,
                        ...options
                    });
                    this.circuitBreaker.recordSuccess();
                    return result.data;
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        this.handleAxiosError(error, endpoint);
                    }
                    throw error;
                }
            }, retryOptions);

            return response;
        } catch (error) {
            if (this.circuitBreaker.recordFailure()) {
                console.warn(`Circuit breaker opened for ${this.config.baseUrl}`);
            }
            if (axios.isAxiosError(error)) {
                this.handleAxiosError(error, endpoint);
            }
            // Handle unknown error type
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new ApiRequestError(`Request failed: ${errorMessage}`, endpoint);
        }
    }

    /**
     * Handle Axios errors and convert them to specific error types
     */
    private handleAxiosError(error: AxiosError, endpoint: string): never {
        const status = error.response?.status;

        if (status === 429) {
            const retryAfter = parseInt(error.response?.headers['retry-after'] || '0', 10);
            throw new RateLimitError(endpoint, retryAfter);
        }

        if (status === 401 || status === 403) {
            throw new AuthenticationError(endpoint);
        }

        if (status === 404) {
            throw new NotFoundError('Resource', endpoint);
        }

        throw new ApiRequestError(
            (error.response?.data as { message?: string })?.message || error.message || 'Unknown error',
            endpoint,
            status
        );
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
    protected get<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T> {
        return this.request<T>('GET', endpoint, {
            params,
            headers: headers ? { ...headers } : undefined
        });
    }
}

export class CircuitBreaker {
    private failures: number = 0;
    private lastFailureTime: number = 0;
    private isOpen: boolean = false;

    constructor(
        private threshold: number = 5,
        private resetTimeout: number = 30000
    ) { }

    recordSuccess(): void {
        this.failures = 0;
        this.isOpen = false;
    }

    recordFailure(): boolean {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.threshold) {
            this.isOpen = true;
        }

        return this.isOpen;
    }

    canRequest(): boolean {
        if (!this.isOpen) return true;

        // Check if circuit can be reset
        if (Date.now() - this.lastFailureTime > this.resetTimeout) {
            this.isOpen = false;
            return true;
        }

        return false;
    }
} 