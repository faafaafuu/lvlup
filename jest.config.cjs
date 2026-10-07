module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps/api'],
  testMatch: ['**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json', diagnostics: { warnOnly: false } }],
  },
  moduleNameMapper: {
    '^@levelup/domain$': '<rootDir>/packages/domain/src/index.ts',
  },
};
