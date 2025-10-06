/**
 * NativeWind CSS Interop Configuration
 * Optional: Customize CSS interop behavior
 */

module.exports = {
  input: './global.css',
  output: {
    ios: './dist/output.ios.css',
    android: './dist/output.android.css',
  },
  // Enable additional features
  experiments: {
    // Enable CSS variables support
    cssVariables: true,
  },
};
