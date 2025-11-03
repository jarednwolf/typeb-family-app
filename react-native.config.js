module.exports = {
  dependencies: {
    // Temporarily disable RevenueCat native linking on iOS to unblock build
    'react-native-purchases': { platforms: { ios: null } },
  },
};


