# TypeB Family App

ADHD-Friendly Family Task Management System

## 🚀 Current Status

**Version**: 1.1.0  
**Build**: #24 (Successfully submitted to TestFlight)  
**Status**: In Beta Testing  
**TestFlight**: Available for internal testing  
**App Store**: Preparing for submission after beta phase  

## 📱 Demo Accounts

For testing purposes, use these pre-configured accounts:

- **Parent Account**: demo@typebapp.com (Password: Demo123!)
- **Child Account**: demo.child@typebapp.com (Password: Demo123!)
- **Family Invite Code**: DEMO2025

## 🏗️ Project Structure

```
typeb-family-app/
├── src/                    # Source code
│   ├── screens/           # App screens
│   ├── components/        # Reusable components
│   ├── services/          # Firebase & API services
│   ├── store/            # Redux state management
│   ├── navigation/       # Navigation configuration
│   └── utils/            # Utility functions
├── ios/                   # iOS native code
├── android/              # Android native code
├── assets/               # Images and static assets
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
└── functions/            # Firebase Cloud Functions
```

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo SDK 50
- **State Management**: Redux Toolkit
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Navigation**: React Navigation 6
- **UI Components**: React Native Elements, Expo components
- **Testing**: Jest, Detox (E2E)
- **Build System**: EAS Build
- **Distribution**: TestFlight (iOS), Google Play Console (Android)

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd typeb-family-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase configuration

# iOS specific setup (Mac only)
cd ios && pod install && cd ..
```

### Development

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Run E2E tests
npm run e2e:ios
```

### Building for Production

```bash
# Build for iOS (TestFlight/App Store)
eas build --platform ios --profile production

# Build for Android (Google Play)
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 📋 Key Features

### Core Functionality
- ✅ User authentication (Email/Password)
- ✅ Family creation and management
- ✅ Task creation with categories and priorities
- ✅ Photo validation for task completion
- ✅ Real-time synchronization
- ✅ Push notifications
- ✅ Points and rewards system
- ✅ Role-based permissions (Parent/Child)

### ADHD-Specific Features
- ✅ Visual task cards with colors and icons
- ✅ Smart reminders and escalation
- ✅ Simple, uncluttered interface
- ✅ Positive reinforcement system
- ✅ Flexible scheduling options

### Premium Features (In Development)
- 🔄 Advanced analytics dashboard
- 🔄 Custom categories and rewards
- 🔄 Unlimited family members
- 🔄 Priority support

## 📱 Platform Support

- **iOS**: 13.0+ (iPhone and iPad)
- **Android**: API 21+ (Android 5.0+)
- **Web**: Not currently supported

## 🔐 Security & Privacy

- End-to-end encryption for sensitive data
- COPPA compliant for children under 13
- GDPR compliant data handling
- Secure photo storage with access controls
- Regular security audits

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Standards](docs/development-standards.md)
- [Firebase Setup Guide](docs/firebase-setup-guide.md)
- [TestFlight Submission Guide](docs/TESTFLIGHT-SUBMISSION-GUIDE.md)
- [App Store Submission Guide](docs/APP-STORE-SUBMISSION-GUIDE.md)

## 🧪 Testing

The app includes comprehensive testing:
- Unit tests for utilities and services
- Integration tests for Firebase operations
- E2E tests for critical user flows
- Manual testing checklist for releases

## 🚀 Deployment

### Current Environments
- **Development**: Local development with Firebase emulators
- **Staging**: TestFlight beta testing
- **Production**: App Store (pending)

### CI/CD Pipeline
- GitHub Actions for automated testing
- EAS Build for native builds
- Automatic submission to TestFlight

## 📈 Monitoring

- Firebase Crashlytics for crash reporting
- Firebase Analytics for usage metrics
- Sentry for error tracking (configured)
- Firebase Performance Monitoring

## 🤝 Contributing

Please read our contributing guidelines before submitting PRs.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

- Email: support@typebapp.com
- Website: https://typebapp.com (coming soon)
- Documentation: [docs/](docs/)

## 🎯 Roadmap

### Phase 1 (Complete) ✅
- Core task management
- Family system
- Basic notifications
- TestFlight release

### Phase 2 (Current) 🚧
- Beta testing feedback incorporation
- Bug fixes and performance improvements
- App Store submission preparation

### Phase 3 (Upcoming) 📅
- Website launch (typebapp.com)
- Advanced analytics
- Family photo sharing
- Custom avatars
- Android release

### Phase 4 (Future) 🔮
- Web app version
- School integration
- Therapist portal
- AI-powered suggestions

---

**Last Updated**: February 10, 2025  
**Build Status**: ✅ Passing  
**TestFlight Status**: 🟢 Live (Build #24)