# Phase 10: Local Setup, Development & Deployment Guide — PocketWise

This guide provides step-by-step instructions for configuring a local development environment, executing automated test suites, running native Android builds, and deploying production packages for PocketWise.

---

## 1. Prerequisites & System Requirements

### 1.1 Developer Machine Requirements
- **Operating System**: macOS (recommended for iOS + Android), Windows (via WSL2 or native PowerShell), or modern Linux.
- **Node.js**: Version `20.x` or `22.x` LTS.
- **Package Manager**: `npm` (v10+) or `bun` (if configured).
- **Git**: Installed and configured.

### 1.2 Android Native Development Prerequisites
To run or build the native Android Automatic UPI Detection Service:
- **Java Development Kit (JDK)**: OpenJDK 17 (required by React Native 0.86 & Expo SDK 57).
- **Android Studio**: Android Studio Hedgehog / Iguana / Jellyfish with:
  - Android SDK Platform `34` or `35`.
  - Android SDK Build-Tools `34.0.0` or `35.0.0`.
  - Android NDK (Native Development Kit) installed.
  - Android Virtual Device (AVD) running Android 10+ (API Level 29+), or a physical Android device with USB Debugging enabled.
- **Environment Variables**:
  - `ANDROID_HOME`: Path to Android SDK (e.g. `%LOCALAPPDATA%\Android\Sdk` on Windows or `$HOME/Library/Android/sdk` on macOS).
  - `JAVA_HOME`: Path to JDK 17.

### 1.3 Tooling & CLIs
- **Expo CLI**: Bundled with SDK (`npx expo`).
- **EAS CLI**: `npm install -g eas-cli` (or run via `npx eas-cli@latest`).

---

## 2. Environment Variables Configuration

Because PocketWise is an offline-first client application, it **does not require remote database passwords, secret API keys, or cloud tokens** in a `.env` file for core functionality.

The primary cloud identifier is the **EAS Project ID**, which is declared in [app.json](file:///D:/Pocketwise/app.json):
```json
"extra": {
  "eas": {
    "projectId": "db6674ea-3c16-41da-8ece-8426af9a7ac9"
  }
}
```

---

## 3. Local Installation & Setup Steps

### Step 1: Clone the Repository
```bash
git clone <repository-url> pocketwise
cd pocketwise
```

### Step 2: Install Node Dependencies
Install SDK-compatible versions using npm:
```bash
npm install
```
*(Do not use bare `yarn add` or `npm install <pkg>` for Expo native libraries; always use `npx expo install <package>` to maintain version compatibility with Expo SDK 57).*

### Step 3: Run Dependency & Configuration Diagnostics
Verify that installed packages match Expo SDK 57 requirements:
```bash
npx expo-doctor
```

---

## 4. Development Server Execution

### 4.1 Running in Expo Go / Metro Bundler
Start the Metro development server:
```bash
npm start
# or: npx expo start
```
- Press `a` in the terminal to launch the Android emulator.
- Press `w` to open in a web browser.
- Press `r` to reload the bundle.

> [!WARNING]
> **Expo Go Limitation**: Standard Expo Go does NOT bundle PocketWise's custom native `UPINotificationListenerService.kt`. While all UI features, budgets, savings goals, and manual transaction tracking work inside Expo Go, testing real background UPI detection requires a Development Build (`npx expo run:android`).

### 4.2 Running a Native Android Development Build
To compile and execute the complete native Kotlin Android module:
```bash
# Generate native android/ directory and run on connected device/emulator
npm run android
# or: npx expo run:android
```

---

## 5. Automated Testing & Verification

PocketWise includes a comprehensive Jest test harness verifying financial calculation algorithms and notification parsers.

### Run Unit Tests
```bash
npm test
```
**Expected Output**:
```
PASS src/__tests__/upiDetection.test.ts
PASS src/__tests__/financialCalculations.test.ts

Test Suites: 2 passed, 2 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        ~7.0 s
```

### Run Static Typecheck
```bash
npm run typecheck
```
*(Note: As identified in Phase 12 audit, `App.tsx` line 34 contains a known StatusBar typing property mismatch that should be noted).*

---

## 6. Seed Data & Demo Configurations

In [src/constants/initialData.ts](file:///D:/Pocketwise/src/constants/initialData.ts#L8), PocketWise maintains a developer-only configuration toggle:

```typescript
export const ENABLE_DEMO_DATA = false;
```

- **When `false` (Production & Default)**: The application boots with pristine, zero-balance financial accounts, empty transaction ledgers, and zero mock data.
- **When `true` (Demo & Testing Mode)**: The application pre-populates realistic sample accounts (HDFC Salary, Cash in Hand, Paytm Wallet, ICICI Card), sample budgets (Food, Shopping), sample savings targets (Emergency Fund, MacBook Pro, Japan Vacation), and recent transaction history.

---

## 7. Production Build & Deployment Pipeline (EAS Build)

PocketWise utilizes **Expo Application Services (EAS Build)** to sign, compile, and produce release Android binaries in the cloud.

### 7.1 EAS Build Configurations (`eas.json`)
```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 7.2 Generating a Production Android App Bundle (.aab)
To build an optimized, signed Android App Bundle ready for Google Play Console upload:
```bash
npx eas-cli@latest build --platform android --profile production
```
1. EAS executes `npx expo prebuild`.
2. Applies the custom config plugin `./plugins/withUpiDetector.js`.
3. Injects Kotlin notification services and manifest permissions.
4. Compiles with ProGuard/R8 code minification enabled.
5. Returns a signed `.aab` file ready for submission to Google Play Store.

### 7.3 Submitting to Google Play Store
Submit directly from the command line:
```bash
npx eas-cli@latest submit --platform android
```
*(Requires Google Play service account JSON key with release permissions).*

