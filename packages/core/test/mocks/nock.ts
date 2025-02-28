// Mock implementation of nock
interface MockNock {
    disableNetConnect: jest.Mock;
    enableNetConnect: jest.Mock;
    cleanAll: jest.Mock;
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
    query: jest.Mock;
    matchHeader: jest.Mock;
    reply: jest.Mock;
    replyWithError: jest.Mock;
}

const nock: MockNock = {
    disableNetConnect: jest.fn(),
    enableNetConnect: jest.fn(),
    cleanAll: jest.fn(),
    get: jest.fn(() => nock),
    post: jest.fn(() => nock),
    put: jest.fn(() => nock),
    delete: jest.fn(() => nock),
    query: jest.fn(() => nock),
    matchHeader: jest.fn(() => nock),
    reply: jest.fn(() => nock),
    replyWithError: jest.fn(() => nock)
};

export default (baseUrl: string): MockNock => {
    return nock;
}; 