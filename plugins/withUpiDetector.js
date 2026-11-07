const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE_NAME = 'com.pocketwise.upidetector.service.UPINotificationListenerService';
const PACKAGE_CLASS = 'com.pocketwise.upidetector.module.UPITransactionDetectionPackage';

/**
 * Configure AndroidManifest.xml with notification listener service & permissions
 */
function modifyAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) {
      return config;
    }

    // Ensure permissions
    const manifest = config.modResults.manifest;
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.POST_NOTIFICATIONS',
    ];

    for (const perm of permissions) {
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm
      );
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    }

    // Ensure service exists
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceExists = mainApplication.service.some(
      (s) => s.$?.['android:name'] === SERVICE_NAME
    );

    if (!serviceExists) {
      mainApplication.service.push({
        $: {
          'android:name': SERVICE_NAME,
          'android:label': 'PocketWise UPI Expense Detector',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name':
                    'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
}

/**
 * Copy native Kotlin files into Android project directory
 */
function copyNativeSourceFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const nativeSrcDir = path.join(projectRoot, 'src', 'native', 'android');
      const targetDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        'com',
        'pocketwise',
        'upidetector'
      );

      function copyRecursive(src, dest) {
        if (!fs.existsSync(src)) return;
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          if (entry.isDirectory()) {
            copyRecursive(srcPath, destPath);
          } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }

      copyRecursive(nativeSrcDir, targetDir);
      return config;
    },
  ]);
}

/**
 * Register UPITransactionDetectionPackage in MainApplication.kt
 */
function modifyMainApplication(config) {
  return withMainApplication(config, (config) => {
    let content = config.modResults.contents;

    // 1. Add import if not present
    if (!content.includes(PACKAGE_CLASS)) {
      content = content.replace(
        /package\s+com\.taha_911\.pocketwise/,
        `package com.taha_911.pocketwise\n\nimport ${PACKAGE_CLASS}`
      );
    }

    // 2. Add UPITransactionDetectionPackage() to PackageList
    if (!content.includes('UPITransactionDetectionPackage()')) {
      if (content.includes('PackageList(this).packages.apply {')) {
        content = content.replace(
          'PackageList(this).packages.apply {',
          'PackageList(this).packages.apply {\n              add(UPITransactionDetectionPackage())'
        );
      } else if (content.includes('PackageList(this).packages')) {
        content = content.replace(
          'PackageList(this).packages',
          'PackageList(this).packages.apply {\n              add(UPITransactionDetectionPackage())\n            }'
        );
      }
    }

    config.modResults.contents = content;
    return config;
  });
}

const withUpiDetector = (config) => {
  config = modifyAndroidManifest(config);
  config = copyNativeSourceFiles(config);
  config = modifyMainApplication(config);
  return config;
};

module.exports = createRunOncePlugin(withUpiDetector, 'withUpiDetector', '1.0.0');
