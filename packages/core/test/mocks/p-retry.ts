// Mock implementation of p-retry
const pRetry = jest.fn(async (fn) => {
    try {
        return await fn();
    } catch (error) {
        throw error;
    }
});

export default pRetry; 