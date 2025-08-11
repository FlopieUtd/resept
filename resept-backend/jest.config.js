export default {
  testEnvironment: "node",
  preset: "ts-jest",
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  moduleFileExtensions: ["ts", "js"],
};
