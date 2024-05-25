// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
module.exports = {
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testMatch: ["**/**.spec.ts"],
  transform: {
    ".(js|ts)": "ts-jest",
  },
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx|json)$",
    "package.json",
  ],
  coverageReporters: ["cobertura", "html", "text"],
};
