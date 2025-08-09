# TypeB Family App

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A modern family task management application built with React Native and Firebase. The TypeB Family App helps families organize, assign, and track household tasks while promoting responsibility and teamwork.

## 🚀 Features

- **Family Management**: Create family groups with unique invite codes
- **Task Assignment**: Parents can create and assign tasks to family members
- **Photo Validation**: Optional photo requirements for task completion
- **Real-time Sync**: Live updates across all family devices
- **Role-based Access**: Distinct permissions for parents and children
- **Points & Rewards**: Gamification to motivate task completion
- **Activity Tracking**: Complete audit trail of family activities

## 📱 Screenshots

<div align="center">
  <img src="docs/screenshots/dashboard.png" width="250" alt="Dashboard" />
  <img src="docs/screenshots/tasks.png" width="250" alt="Tasks" />
  <img src="docs/screenshots/family.png" width="250" alt="Family" />
</div>

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State Management**: Redux Toolkit
- **Language**: TypeScript
- **UI/UX**: Custom component library with TypeB design system

## 📋 Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with enabled services

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/typeb-family-app.git
   cd typeb-family-app
   ```

2. **Install dependencies**
   ```bash
   cd typeb-family-app
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - iOS: Press `i` to open iOS simulator
   - Android: Press `a` to open Android emulator
   - Web: Press `w` to open in browser

## 📁 Project Structure

```
typeb-family-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── services/       # Firebase and API services
│   ├── store/          # Redux store and slices
│   ├── navigation/     # Navigation configuration
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── assets/             # Images, fonts, and other assets
├── docs/               # Documentation
└── __tests__/          # Test files
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Storage
3. Add your configuration to `.env`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

### Platform-specific Setup

- **iOS**: Follow the [iOS setup guide](docs/ios-firebase-setup.md)
- **Android**: Configuration is handled automatically by Expo

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Building for Production

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

### Local Build

```bash
# iOS (Mac only)
expo build:ios

# Android
expo build:android
```

## 🚀 Deployment

See our [deployment guide](docs/deployment-guide.md) for detailed instructions on deploying to:
- App Store (iOS)
- Google Play Store (Android)
- Web hosting (Vercel, Netlify, etc.)

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [Development Standards](docs/development-standards.md)
- [API Documentation](docs/api-documentation.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Release Notes](docs/RELEASE-NOTES-v1.0.0.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues

- Push notifications require a development build (not available in Expo Go)
- Background task execution is limited in the Expo Go environment
- Maximum 10 members per family in the current implementation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ by the TypeB Development Team

## 📞 Support

- Email: support@typebfamily.app
- Documentation: [docs.typebfamily.app](https://docs.typebfamily.app)
- Issues: [GitHub Issues](https://github.com/yourusername/typeb-family-app/issues)

---

**Current Version**: 1.0.0  
**Last Updated**: August 7, 2025