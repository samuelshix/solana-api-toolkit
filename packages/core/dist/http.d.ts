import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiClientConfig } from './types';
/**
 * Base HTTP client with retry logic, error handling, and standardized responses
 */
export declare class HttpClient {
    protected client: AxiosInstance;
    protected config: ApiClientConfig;
    private circuitBreaker;
    constructor(config: ApiClientConfig);
    /**
     * Make an HTTP request with retry logic
     */
    protected request<T>(method: string, endpoint: string, options?: AxiosRequestConfig): Promise<T>;
    /**
     * Handle Axios errors and convert them to specific error types
     */
    private handleAxiosError;
    /**
     * Make a GET request with additional headers
     */
    protected get<T>(endpoint: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
}
export declare class CircuitBreaker {
    private threshold;
    private resetTimeout;
    private failures;
    private lastFailureTime;
    private isOpen;
    constructor(threshold?: number, resetTimeout?: number);
    recordSuccess(): void;
    recordFailure(): boolean;
    canRequest(): boolean;
}
