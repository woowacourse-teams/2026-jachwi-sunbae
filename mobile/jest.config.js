module.exports = {
  preset: '@react-native/jest-preset',
  // pnpm stores packages under node_modules/.pnpm. Allow React Native's
  // Flow/ESM sources to pass through Babel just like the preset's npm layout.
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(?:react-native|@react-native\\+[^@]+)@)',
    'node_modules/(?!\\.pnpm/|((jest-)?react-native|@react-native(-community)?)/)',
  ],
};
