export default {
  clearMocks: true,
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
  // coverageProvider: 'v8',
  roots: ['src'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@root/(.*)': '<rootDir>/src/$1',
    '^@helpers/(.*)': '<rootDir>/src/helpers/$1',
    '^@middlewares/(.*)': '<rootDir>/src/middlewares/$1',
    '^@commands/(.*)': '<rootDir>/src/commands/$1',
    '^@models/(.*)': '<rootDir>/src/models/$1',
  },
}
