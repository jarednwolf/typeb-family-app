#!/usr/bin/env node

/**
 * Firebase Configuration Verification Script
 * Run this after setting up your Firebase project to verify everything is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Firebase Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('   Please create it by copying .env.example:');
  console.log('   cp .env.example .env\n');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

// Required Firebase environment variables
const requiredVars = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
];

const optionalVars = [
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

// Parse environment variables
const envVars = {};
lines.forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Check required variables
let hasErrors = false;
console.log('📋 Checking required Firebase configuration:\n');

requiredVars.forEach(varName => {
  if (!envVars[varName] || envVars[varName] === '' || envVars[varName].includes('your_')) {
    console.error(`❌ ${varName}: Missing or not configured`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('\n📋 Checking optional configuration:\n');

optionalVars.forEach(varName => {
  if (!envVars[varName] || envVars[varName] === '') {
    console.log(`⚠️  ${varName}: Not configured (optional)`);
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

// Validate format of certain fields
console.log('\n🔍 Validating configuration format:\n');

if (envVars['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN']) {
  if (!envVars['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'].includes('.firebaseapp.com')) {
    console.error('❌ AUTH_DOMAIN should end with .firebaseapp.com');
    hasErrors = true;
  } else {
    console.log('✅ AUTH_DOMAIN format is correct');
  }
}

if (envVars['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET']) {
  // Both .appspot.com and .firebasestorage.app are valid formats
  if (!envVars['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'].includes('.appspot.com') &&
      !envVars['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'].includes('.firebasestorage.app')) {
    console.error('❌ STORAGE_BUCKET should end with .appspot.com or .firebasestorage.app');
    hasErrors = true;
  } else {
    console.log('✅ STORAGE_BUCKET format is correct');
  }
}

if (envVars['EXPO_PUBLIC_FIREBASE_API_KEY']) {
  if (!envVars['EXPO_PUBLIC_FIREBASE_API_KEY'].startsWith('AIza')) {
    console.error('❌ API_KEY should start with AIza');
    hasErrors = true;
  } else {
    console.log('✅ API_KEY format appears correct');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('\n❌ Firebase configuration is incomplete or incorrect!');
  console.log('\nPlease follow these steps:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Go to Project Settings (gear icon)');
  console.log('4. Scroll down to "Your apps" section');
  console.log('5. Add a Web app if you haven\'t already');
  console.log('6. Copy the configuration values to your .env file');
} else {
  console.log('\n✅ Firebase configuration looks good!');
  console.log('\nNext steps:');
  console.log('1. Run: npm start');
  console.log('2. Test creating an account');
  console.log('3. Test signing in');
  console.log('4. Test password reset');
}

console.log('\n' + '='.repeat(50));

// Check if .gitignore includes .env
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('.env')) {
    console.warn('\n⚠️  WARNING: .env is not in .gitignore!');
    console.log('   This could expose your Firebase credentials.');
    console.log('   Add ".env" to your .gitignore file immediately!');
  } else {
    console.log('\n✅ .env is properly excluded from Git');
  }
}

process.exit(hasErrors ? 1 : 0);