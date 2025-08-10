const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withRevenueCatFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Check if our fix is already present
        if (!podfileContent.includes('Fix for RevenueCat SubscriptionPeriod')) {
          // Find the post_install block and add our comprehensive fix
          const postInstallFix = `
    # Fix for RevenueCat SubscriptionPeriod ambiguity with iOS 18 SDK
    installer.pods_project.targets.each do |target|
      # Fix for PurchasesHybridCommon
      if target.name == 'PurchasesHybridCommon'
        target.build_configurations.each do |config|
          config.build_settings['SWIFT_VERSION'] = '5.0'
          config.build_settings['OTHER_SWIFT_FLAGS'] = '$(inherited) -Xfrontend -module-name -Xfrontend PurchasesHybridCommon'
          config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
          config.build_settings['SWIFT_OBJC_BRIDGING_HEADER'] = ''
        end
        
        # Modify the source files to fix ambiguity
        target.source_build_phase.files.each do |file|
          if file.file_ref && file.file_ref.path && file.file_ref.path.include?('StoreProduct+HybridAdditions.swift')
            file_path = file.file_ref.real_path.to_s
            if File.exist?(file_path)
              content = File.read(file_path)
              # Replace ambiguous SubscriptionPeriod references
              content.gsub!('SubscriptionPeriod.Unit', 'RevenueCat.SubscriptionPeriod.Unit')
              content.gsub!(/static func rc_normalized\\(subscriptionPeriodUnit: SubscriptionPeriod\\.Unit\\)/, 
                           'static func rc_normalized(subscriptionPeriodUnit: RevenueCat.SubscriptionPeriod.Unit)')
              File.write(file_path, content)
            end
          end
        end
      end
      
      # Fix for RNPurchases
      if target.name == 'RNPurchases'
        target.build_configurations.each do |config|
          config.build_settings['SWIFT_VERSION'] = '5.0'
          config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
        end
      end
    end`;
          
          // Insert the fix into the post_install block
          podfileContent = podfileContent.replace(
            /post_install do \|installer\|([\s\S]*?)(\n\s*end)/,
            (match, content, ending) => {
              // Check if there's already a RevenueCat fix section
              if (content.includes('RevenueCat')) {
                // Replace the existing fix
                return match.replace(/# Fix for RevenueCat[\s\S]*?end\n/, postInstallFix + '\n');
              } else {
                // Add the new fix
                return `post_install do |installer|${content}${postInstallFix}${ending}`;
              }
            }
          );
          
          fs.writeFileSync(podfilePath, podfileContent);
        }
      }
      
      // Also create a patch file for the problematic Swift file
      const patchDir = path.join(projectRoot, 'ios', 'Patches');
      if (!fs.existsSync(patchDir)) {
        fs.mkdirSync(patchDir, { recursive: true });
      }
      
      const patchContent = `--- a/StoreProduct+HybridAdditions.swift
+++ b/StoreProduct+HybridAdditions.swift
@@ -1,5 +1,6 @@
 import Foundation
 import RevenueCat
+import StoreKit
 
 extension StoreProduct {
     
@@ -62,7 +63,7 @@
         return nil
     }
     
-    static func rc_normalized(subscriptionPeriodUnit: SubscriptionPeriod.Unit) -> String {
+    static func rc_normalized(subscriptionPeriodUnit: RevenueCat.SubscriptionPeriod.Unit) -> String {
         switch subscriptionPeriodUnit {
         case .day:
             return "DAY"`;
      
      fs.writeFileSync(path.join(patchDir, 'StoreProduct+HybridAdditions.patch'), patchContent);
      
      return config;
    },
  ]);
};