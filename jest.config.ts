import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
};

export default config;
