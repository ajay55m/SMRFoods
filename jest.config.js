module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      '<rootDir>/node_modules/react-native/jest/assetFileTransformer.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-webview)/',
  ],
};
