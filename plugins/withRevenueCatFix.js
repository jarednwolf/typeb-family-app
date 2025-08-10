const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function fixRevenueCatSubscriptionPeriod(projectRoot) {
  // Paths to check for the problematic files
  const possiblePaths = [
    path.join(projectRoot, 'ios', 'Pods', 'PurchasesHybridCommon', 'ios', 'PurchasesHybridCommon', 'PurchasesHybridCommon'),
    path.join(projectRoot, 'node_modules', 'react-native-purchases', 'ios', 'PurchasesHybridCommon', 'PurchasesHybridCommon'),
  ];

  for (const basePath of possiblePaths) {
    const filePath = path.join(basePath, 'StoreProduct+HybridAdditions.swift');
    
    if (fs.existsSync(filePath)) {
      console.log(`Fixing RevenueCat SubscriptionPeriod ambiguity in: ${filePath}`);
      
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add StoreKit import if not present
      if (!content.includes('import StoreKit')) {
        content = content.replace(
          'import RevenueCat',
          'import RevenueCat\nimport StoreKit'
        );
      }
      
      // Fix the ambiguous SubscriptionPeriod references
      content = content.replace(
        /subscriptionPeriodUnit: SubscriptionPeriod\.Unit/g,
        'subscriptionPeriodUnit: RevenueCat.SubscriptionPeriod.Unit'
      );
      
      // Fix the switch statement
      content = content.replace(
        /switch subscriptionPeriodUnit \{/g,
        'switch subscriptionPeriodUnit as RevenueCat.SubscriptionPeriod.Unit {'
      );
      
      fs.writeFileSync(filePath, content);
      console.log('✅ Fixed StoreProduct+HybridAdditions.swift');
    }
  }
}

module.exports = function withRevenueCatFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      
      // Fix during prebuild
      fixRevenueCatSubscriptionPeriod(projectRoot);
      
      // Also update the Podfile to include the fix in post_install
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        if (!podfileContent.includes('Fix for RevenueCat SubscriptionPeriod')) {
          const postInstallHook = `
    # Fix for RevenueCat SubscriptionPeriod ambiguity with iOS 18 SDK
    installer.pods_project.targets.each do |target|
      if target.name == 'PurchasesHybridCommon'
        # Find and fix the problematic Swift file
        target.source_build_phase.files.each do |file|
          if file.file_ref && file.file_ref.path && file.file_ref.path.include?('StoreProduct+HybridAdditions.swift')
            file_path = file.file_ref.real_path.to_s
            if File.exist?(file_path)
              content = File.read(file_path)
              
              # Add StoreKit import if not present
              unless content.include?('import StoreKit')
                content = content.sub('import RevenueCat', "import RevenueCat\\nimport StoreKit")
              end
              
              # Fix ambiguous references
              content = content.gsub('subscriptionPeriodUnit: SubscriptionPeriod.Unit', 
                                    'subscriptionPeriodUnit: RevenueCat.SubscriptionPeriod.Unit')
              
              File.write(file_path, content)
              puts "Fixed RevenueCat SubscriptionPeriod ambiguity"
            end
          end
        end
        
        target.build_configurations.each do |config|
          config.build_settings['SWIFT_VERSION'] = '5.0'
          config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
        end
      end
    end`;
          
          // Insert into post_install block
          podfileContent = podfileContent.replace(
            /post_install do \|installer\|([\s\S]*?)(\n\s*end)/,
            (match, content, ending) => {
              // Remove any existing RevenueCat fix
              const cleanContent = content.replace(/# Fix for RevenueCat[\s\S]*?end\n\s*end/g, '');
              return `post_install do |installer|${cleanContent}${postInstallHook}${ending}`;
            }
          );
          
          fs.writeFileSync(podfilePath, podfileContent);
        }
      }
      
      return config;
    },
  ]);
};