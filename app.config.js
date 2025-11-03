export default ({ config }) => {
  // Determine environment
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  const isProduction = environment === 'production';
  const isStaging = environment === 'staging';
  
  // Environment-specific app identifiers
  const appIdentifier = isProduction
    ? 'com.typebapp.family'
    : isStaging
      ? 'com.typebapp.family.staging'
      : 'com.typebapp.family.dev';
  
  const appName = isProduction
    ? 'TypeB Family'
    : isStaging
      ? 'TypeB Staging'
      : 'TypeB Dev';
  
  // Firebase configuration based on environment
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  };

  // RevenueCat configuration
  const revenueCatKeys = {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
    android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID
  };

  // Sentry configuration
  const sentryConfig = {
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: environment,
    release: config.version,
    dist: `${config.version}-${environment}`
  };
  
  // Google OAuth configuration
  const googleAuth = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  };

  return {
    ...config,
    name: appName,
    slug: 'typeb-family-app',
    version: config.version || '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/[project-id]'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: appIdentifier,
      buildNumber: config.ios?.buildNumber || '1',
      infoPlist: {
        NSPhotoLibraryUsageDescription: 'This app needs access to photo library to upload task completion photos.',
        NSCameraUsageDescription: 'This app needs access to camera to take task completion photos.'
      },
      googleServicesFile: isProduction
        ? './GoogleService-Info-prod.plist'
        : './GoogleService-Info-staging.plist'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      },
      package: appIdentifier,
      versionCode: config.android?.versionCode || 1,
      googleServicesFile: isProduction
        ? './google-services-prod.json'
        : './google-services-staging.json',
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE'
      ]
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    extra: {
      ...config.extra,
      environment,
      firebase: firebaseConfig,
      revenueCat: revenueCatKeys,
      sentry: sentryConfig,
      googleAuth,
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      webUrl: process.env.EXPO_PUBLIC_WEB_URL,
      features: {
        googleSSO: process.env.EXPO_PUBLIC_FEATURE_GOOGLE_SSO === 'true',
        appleSignIn: process.env.EXPO_PUBLIC_FEATURE_APPLE_SIGNIN === 'true',
        pushNotifications: process.env.EXPO_PUBLIC_FEATURE_PUSH_NOTIFICATIONS === 'true',
        analytics: process.env.EXPO_PUBLIC_FEATURE_ANALYTICS === 'true',
        premium: process.env.EXPO_PUBLIC_FEATURE_PREMIUM === 'true'
      },
      coppa: {
        photoRetentionDays: parseInt(process.env.COPPA_PHOTO_RETENTION_DAYS || '90'),
        consentExpiryDays: parseInt(process.env.COPPA_CONSENT_EXPIRY_DAYS || '365'),
        minAge: parseInt(process.env.COPPA_MIN_AGE || '13')
      },
      eas: {
        projectId: process.env.EAS_PROJECT_ID
      }
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-firebase/firestore',
      // Push notifications (ensures iOS capabilities/entitlements)
      'expo-notifications',
      // Media and camera
      [
        'expo-camera',
        {
          cameraPermission: 'Allow TypeB to access your camera to take task completion photos.'
        }
      ],
      [
        'expo-media-library',
        {
          photosPermission: 'Allow TypeB to access your photos for task completion verification.',
          savePhotosPermission: 'Allow TypeB to save photos to your photo library.',
          isAccessMediaLocationEnabled: false
        }
      ],
      // Keep image picker support consistent with app.json
      'expo-image-picker',
      'sentry-expo'
    ]
  };
};
