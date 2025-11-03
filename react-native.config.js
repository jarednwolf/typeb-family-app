module.exports = {
  dependencies: {
    // Temporarily disable RevenueCat native linking on iOS to unblock build
    'react-native-purchases': { platforms: { ios: null } },
    // Temporarily disable Sentry native linking on iOS to bypass C++ build issues on CI image
    '@sentry/react-native': { platforms: { ios: null } },
  },
};


