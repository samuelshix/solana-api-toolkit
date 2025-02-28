/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/test/**/*.test.ts'
    ],
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/types.ts',
        '!src/index.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(p-retry|retry))'
    ],
    // Mock p-retry to avoid ESM issues
    moduleNameMapper: {
        'p-retry': '<rootDir>/test/mocks/p-retry.js'
    }
}; 