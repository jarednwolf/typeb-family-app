#!/usr/bin/env node

/**
 * Generate App Icons for iOS and Android
 * This script creates all required icon sizes from the TypeB logo
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const SOURCE_LOGO = path.join(ASSETS_DIR, 'type_b_logo.png');

// Icon sizes needed
const ICON_SIZES = {
  'icon.png': 1024,           // Main app icon (Expo will resize for iOS/Android)
  'adaptive-icon.png': 1024,  // Android adaptive icon
  'favicon.png': 48,          // Web favicon
  'splash-icon.png': 512      // Splash screen icon
};

async function generateIcons() {
  console.log('🎨 Generating app icons from TypeB logo...\n');

  // Check if source logo exists
  if (!fs.existsSync(SOURCE_LOGO)) {
    console.error('❌ Source logo not found at:', SOURCE_LOGO);
    process.exit(1);
  }

  for (const [filename, size] of Object.entries(ICON_SIZES)) {
    const outputPath = path.join(ASSETS_DIR, filename);
    
    try {
      // Create icon with white background for better visibility
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated ${filename} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${filename}:`, error.message);
    }
  }

  // Also generate iOS specific icons in the iOS project
  const IOS_ICON_SIZES = [
    { name: 'Icon-20@2x.png', size: 40 },
    { name: 'Icon-20@3x.png', size: 60 },
    { name: 'Icon-29@2x.png', size: 58 },
    { name: 'Icon-29@3x.png', size: 87 },
    { name: 'Icon-40@2x.png', size: 80 },
    { name: 'Icon-40@3x.png', size: 120 },
    { name: 'Icon-60@2x.png', size: 120 },
    { name: 'Icon-60@3x.png', size: 180 },
    { name: 'Icon-1024.png', size: 1024 }
  ];

  const iosIconPath = path.join(__dirname, '..', 'ios', 'TypeBFamily', 'Images.xcassets', 'AppIcon.appiconset');
  
  if (fs.existsSync(iosIconPath)) {
    console.log('\n📱 Generating iOS specific icons...\n');
    
    for (const icon of IOS_ICON_SIZES) {
      const outputPath = path.join(iosIconPath, icon.name);
      
      try {
        await sharp(SOURCE_LOGO)
          .resize(icon.size, icon.size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .png()
          .toFile(outputPath);
        
        console.log(`✅ Generated iOS ${icon.name} (${icon.size}x${icon.size})`);
      } catch (error) {
        console.error(`❌ Failed to generate iOS ${icon.name}:`, error.message);
      }
    }
  }

  console.log('\n🎉 App icons generated successfully!');
  console.log('📝 Note: You may need to rebuild the app for icons to take effect.');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  generateIcons();
} catch (e) {
  console.log('📦 Installing sharp for image processing...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  generateIcons();
}