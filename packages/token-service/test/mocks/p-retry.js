// Mock implementation of p-retry
const pRetry = jest.fn(async (fn) => {
    try {
        return await fn();
    } catch (error) {
        throw error;
    }
});

module.exports = pRetry; 