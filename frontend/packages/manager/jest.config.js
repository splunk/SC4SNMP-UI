module.exports = {
    testMatch: ['**/*.test.[jt]s?(x)'],
    testEnvironment: "jsdom",
    setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect"
  ]
};
