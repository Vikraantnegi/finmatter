module.exports = {
  root: false, // Don't make this the root config
  extends: ['../../.eslintrc.js'],
  ignorePatterns: [
    '*.config.js',
    '*.config.ts',
    'index.js',
    'jest.config.js',
    'metro.config.js',
    'tailwind.config.js',
  ],
};
