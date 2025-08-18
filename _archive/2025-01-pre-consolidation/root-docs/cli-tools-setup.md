# CLI Tools Setup Guide

## Required Command Line Tools for TypeB Development

### Core Development Tools

#### 1. Node.js & npm
```bash
# Check if installed
node --version  # Should be v18+ 
npm --version   # Should be v9+

# Install via Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18
```

#### 2. Expo CLI
```bash
# Install globally
npm install -g expo-cli eas-cli

# Verify installation
expo --version
eas --version

# Login to Expo account (create one if needed)
expo login
```

#### 3. Firebase CLI
```bash
# Install globally
npm install -g firebase-tools

# Verify installation
firebase --version

# Login to Firebase
firebase login

# Initialize emulators for local testing
firebase init emulators
```

#### 4. Git
```bash
# Check if installed
git --version

# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### iOS Development Tools (Mac Only)

#### 5. Xcode & Command Line Tools
```bash
# Install Xcode from App Store first, then:
xcode-select --install

# Accept license
sudo xcodebuild -license accept

# Install iOS Simulator
xcrun simctl list devices
```

#### 6. CocoaPods
```bash
# Install via gem
sudo gem install cocoapods

# Or via Homebrew
brew install cocoapods

# Verify
pod --version
```

#### 7. Watchman (for React Native)
```bash
# Install via Homebrew
brew install watchman

# Verify
watchman --version
```

### Testing & Quality Tools

#### 8. Jest CLI
```bash
# Will be installed locally per project, but useful globally
npm install -g jest

# For React Native testing
npm install -g detox-cli
```

#### 9. ESLint & Prettier
```bash
# Install globally for IDE integration
npm install -g eslint prettier

# TypeScript support
npm install -g typescript ts-node
```

### Automation & Productivity Tools

#### 10. GitHub CLI
```bash
# macOS
brew install gh

# Login
gh auth login
```

#### 11. Make (for automation)
```bash
# Usually pre-installed on Mac
make --version

# If not installed
brew install make
```

#### 12. jq (JSON processor)
```bash
# Useful for parsing Firebase responses
brew install jq
```

### Optional but Recommended

#### 13. ngrok (for testing webhooks)
```bash
# Install
brew install ngrok/ngrok/ngrok

# Or via npm
npm install -g ngrok
```

#### 14. Act (run GitHub Actions locally)
```bash
# Install
brew install act
```

#### 15. Sentry CLI (for error tracking)
```bash
# Install
npm install -g @sentry/cli
```

## Automation Setup

### Create Makefile for Common Tasks
```makefile
# Makefile
.PHONY: help install test build deploy

help:
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make test       - Run all tests"
	@echo "  make build      - Build for production"
	@echo "  make deploy     - Deploy to TestFlight"

install:
	npm install
	cd ios && pod install
	firebase init

test:
	npm run test
	npm run test:e2e

build:
	eas build --platform ios

deploy:
	eas submit --platform ios

# Development shortcuts
dev:
	expo start

dev-ios:
	expo start --ios

dev-android:
	expo start --android

clean:
	watchman watch-del-all
	rm -rf node_modules
	rm -rf ios/Pods
	npm cache clean --force
	npm install
	cd ios && pod install

# Firebase shortcuts
firebase-emulators:
	firebase emulators:start

firebase-deploy:
	firebase deploy --only functions

# Testing shortcuts
test-unit:
	jest --coverage

test-integration:
	jest --testMatch="**/*.integration.test.ts"

test-e2e:
	detox test

# Code quality
lint:
	eslint . --ext .ts,.tsx

format:
	prettier --write "**/*.{ts,tsx,json,md}"

type-check:
	tsc --noEmit

# Git shortcuts
commit:
	git add .
	git commit -m "$(m)"
	git push

pr:
	gh pr create --fill

# Validation tests (from our docs)
validate-firebase:
	node scripts/validate-firebase.js

validate-notifications:
	node scripts/test-notifications.js

validate-performance:
	node scripts/stress-test.js
```

### Create package.json Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write '**/*.{ts,tsx,json,md}'",
    "type-check": "tsc --noEmit",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "firebase:emulators": "firebase emulators:start",
    "firebase:deploy": "firebase deploy",
    "validate:all": "npm run validate:firebase && npm run validate:notifications",
    "validate:firebase": "ts-node scripts/validate-firebase.ts",
    "validate:notifications": "ts-node scripts/test-notifications.ts",
    "validate:performance": "ts-node scripts/stress-test.ts",
    "precommit": "npm run lint && npm run type-check && npm run test",
    "prepare": "husky install"
  }
}
```

### Create Shell Aliases
```bash
# Add to ~/.zshrc or ~/.bashrc

# TypeB project shortcuts
alias tb="cd ~/Projects/typeb-family-app"
alias tbd="tb && npm run ios"
alias tbt="tb && npm test"
alias tbb="tb && npm run build:ios"
alias tbe="tb && code ."

# Firebase shortcuts
alias fbemu="firebase emulators:start"
alias fbdeploy="firebase deploy"
alias fblog="firebase functions:log"

# Expo shortcuts
alias exs="expo start"
alias exi="expo start --ios"
alias exa="expo start --android"
alias exb="eas build --platform ios"

# Git shortcuts for this project
alias gpc="git add . && git commit -m"
alias gpp="git push"
alias gpr="gh pr create --fill"

# Quick validation
alias validate="npm run validate:all"
```

## Verification Checklist

Run these commands to verify everything is installed correctly:

```bash
# Create verification script
cat > verify-setup.sh << 'EOF'
#!/bin/bash

echo "🔍 Verifying CLI Tools Installation..."
echo ""

# Function to check if command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $2: $($1 --version 2>&1 | head -n 1)"
    else
        echo "❌ $2: Not installed"
    fi
}

# Check all tools
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "expo" "Expo CLI"
check_command "eas" "EAS CLI"
check_command "firebase" "Firebase CLI"
check_command "git" "Git"
check_command "pod" "CocoaPods"
check_command "watchman" "Watchman"
check_command "jest" "Jest"
check_command "eslint" "ESLint"
check_command "prettier" "Prettier"
check_command "tsc" "TypeScript"
check_command "gh" "GitHub CLI"
check_command "make" "Make"
check_command "jq" "jq"

echo ""
echo "📱 iOS Development:"
if xcode-select -p &> /dev/null; then
    echo "✅ Xcode Command Line Tools: $(xcode-select -p)"
else
    echo "❌ Xcode Command Line Tools: Not installed"
fi

echo ""
echo "🔐 Authentication Status:"
firebase projects:list &> /dev/null && echo "✅ Firebase: Logged in" || echo "❌ Firebase: Not logged in"
expo whoami &> /dev/null && echo "✅ Expo: Logged in as $(expo whoami)" || echo "❌ Expo: Not logged in"
gh auth status &> /dev/null && echo "✅ GitHub: Authenticated" || echo "❌ GitHub: Not authenticated"

echo ""
echo "Done! Check for any ❌ marks above and install missing tools."
EOF

chmod +x verify-setup.sh
./verify-setup.sh
```

## Next Steps

Once all CLIs are installed:

1. **Run the verification script** to ensure everything is ready
2. **Set up shell aliases** for faster development
3. **Create the Makefile** in your project root
4. **Initialize Firebase project** for testing
5. **Create Expo project** and start validating

## Troubleshooting

### Common Issues

#### Node Version Conflicts
```bash
# Use nvm to manage versions
nvm install 18
nvm use 18
nvm alias default 18
```

#### Permission Errors
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

#### Expo CLI Issues
```bash
# Clear Expo cache
expo doctor
rm -rf ~/.expo
npm install -g expo-cli@latest
```

#### Firebase CLI Issues
```bash
# Re-authenticate
firebase logout
firebase login --reauth
```

---

**With all these tools installed, we can automate testing, building, and deployment, making development much more efficient.**