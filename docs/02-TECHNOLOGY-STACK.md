# Phase 2: Technology Stack Deep Dive — PocketWise

## 1. Complete Technology Inventory

PocketWise is built using modern JavaScript/TypeScript and native Android Kotlin tooling centered on **Expo SDK 57** and **React Native 0.86.3**. Below is the verified dependency inventory directly extracted from [package.json](file:///D:/Pocketwise/package.json), [app.json](file:///D:/Pocketwise/app.json), and the native Android manifest plugins.

```
PocketWise Tech Stack
├── Runtime & Mobile Framework: React Native 0.86.3 / React 19.2.3 / Expo SDK ~57.0.27
├── Architecture Pattern: Offline-First Client + Background Native Android Service
├── Navigation: React Navigation v7 (Native Stack & Bottom Tabs)
├── State Management: Zustand 5.0.15
├── Data Persistence:
│   ├── Client: @react-native-async-storage/async-storage 2.2.0
│   └── Android Native: SharedPreferences (Mode Private)
├── Native Android Layer: Kotlin, AndroidX Core, NotificationListenerService
├── Build & Prebuild Pipeline: Expo Config Plugin (plugins/withUpiDetector.js), EAS Build
└── Test Harness: Jest 29.7.0, ts-jest 29.4.14
```

---

## 2. Frontend / Client Architecture

### 2.1 Core Frameworks & Tooling
- **React (`19.2.3`)**: Component rendering model, hooks (`useState`, `useEffect`, `useCallback`, `useMemo`), functional architecture.
- **React Native (`0.86.3`)**: Cross-platform primitives (`View`, `Text`, `TouchableOpacity`, `ScrollView`, `FlatList`, `Modal`, `Switch`, `KeyboardAvoidingView`).
- **Expo SDK (`~57.0.27`)**: Native module compilation, splash screen management, vector icons, custom font loader, and configuration plugins.
- **Expo Font (`~57.0.4`) & Splash Screen (`~57.0.9`)**: Manages the native splash screen until the Zustand store is hydrated from disk via `SplashScreen.preventAutoHideAsync()` and `SplashScreen.hideAsync()`.
- **Expo Status Bar (`~57.0.1`)**: Dynamic status bar coloration corresponding to the current theme mode (`light` or `dark`).

### 2.2 Navigation Subsystem: Reality vs. Assumptions
> [!IMPORTANT]
> **Architectural Clarification**: While general Expo documentation often references file-based **Expo Router**, PocketWise's codebase strictly utilizes **React Navigation v7** with component-based navigation defined in `src/navigation/RootNavigator.tsx` and `src/navigation/BottomTabNavigator.tsx`. There is no `app/` directory or file-based routing in the repository.

- **`@react-navigation/native` (`^7.5.0`)**: Navigation container, theme provider (`NavigationContainer`), and navigation context.
- **`@react-navigation/native-stack` (`^7.20.0`)**: Native stack transitions for onboarding, modal routes, report screens, and transaction details.
- **`@react-navigation/bottom-tabs` (`^7.20.0`)**: Persistent bottom tab bar providing quick switching across 5 main views: Home (`DashboardScreen`), Transactions (`TransactionsScreen`), Budgets (`BudgetsScreen`), Savings (`SavingsScreen`), and Profile (`ProfileScreen`).
- **`react-native-safe-area-context` (`~5.7.0`)**: Calculates hardware notch and home indicator insets (`useSafeAreaInsets`) across iOS and Android devices.
- **`react-native-screens` (`~4.26.0`)**: Native screen container primitives optimizing memory consumption by detaching inactive screen fragments.

### 2.3 Gesture Handling & Animation Pipeline
- **`react-native-gesture-handler` (`~2.32.0`)**: Wrapped at the application root (`GestureHandlerRootView`) in [App.tsx](file:///D:/Pocketwise/App.tsx) for responsive touch interaction.
- **`react-native-reanimated` (`4.5.1`) & `react-native-worklets` (`0.10.1`)**: Hardware-accelerated UI thread animations for smooth progress bar fills, slide-overs, and bottom sheet transitions.

### 2.4 Vector Icons & Graphics
- **`@expo/vector-icons` (`^15.0.2`)**: Implements Feather icon set (`Feather`) across all headers, tab bars, category badges, and quick actions.
- **`react-native-svg` (`15.15.4`)**: Renders vector paths and financial chart graphs.

---

## 3. Backend & Network Layer

### 3.1 Backend Architecture: 100% Serverless & Offline-First
PocketWise has **no cloud REST backend, no GraphQL server, and no cloud database**. It functions entirely as a standalone client.
- **Zero Network Ingestion**: The app makes zero HTTP/HTTPS network calls during normal operation. Financial data, user personal information, account balances, and transaction logs never leave the device.
- **No Third-Party Analytics SDKs**: There are no tracking scripts, Firebase Analytics, or telemetry daemons bundled into the application.

### 3.2 Native Android Background Backend
In place of a remote server, PocketWise utilizes an **On-Device Background Daemon** implemented in Kotlin:
- **`UPINotificationListenerService.kt`**: An Android system service running in the Android OS process that actively intercepts incoming payment notifications from supported applications.
- **`UPITransactionDetectionModule.kt`**: A React Native Java/Kotlin bridge module that facilitates bidirectional communication between the native Android notification service and the JavaScript runtime.

---

## 4. Database & Storage Architecture

### 4.1 Client Data Storage: AsyncStorage
PocketWise stores primary user data in the device's sandboxed local filesystem using `@react-native-async-storage/async-storage` (`2.2.0`). Access is controlled through the typed singleton class [StorageService](file:///D:/Pocketwise/src/storage/storageService.ts).

All storage keys use the `@pocketwise_*_v2` prefix defined in [src/storage/keys.ts](file:///D:/Pocketwise/src/storage/keys.ts):
- `@pocketwise_transactions_v2`: Array of `Transaction` objects.
- `@pocketwise_accounts_v2`: Array of `Account` entities with live balances.
- `@pocketwise_budgets_v2`: Array of `Budget` entities.
- `@pocketwise_savings_goals_v2`: Array of `SavingsGoal` objects.
- `@pocketwise_recurring_v2`: Array of `RecurringPayment` commitments.
- `@pocketwise_categories_v2`: List of default and custom `Category` items.
- `@pocketwise_settings_v2`: `UserSettings` JSON object.
- `@pocketwise_detected_transactions_v2`: Mirrored list of detected UPI transactions.

### 4.2 Native Android Storage: SharedPreferences
The Android background listener operates independently from the JavaScript engine and cannot access `AsyncStorage` directly when the React Native context is suspended. It uses two private Android `SharedPreferences` files:
1. `pocketwise_upi_storage`: Stores up to 200 serialized JSON detected transactions and persistent feature toggles (`isDetectionEnabled`, `isAutoConfirmHighConfidence`, `isRefundsEnabled`, `isBankNotificationsEnabled`).
2. `pocketwise_dedup_cache`: Maintains an LRU cache of up to 500 cryptographic SHA-256 deduplication hashes to prevent processing duplicate notifications.

---

## 5. Authentication & Security Stack

| Security Domain | Strategy Employed | Code Reference |
| :--- | :--- | :--- |
| **Authentication Model** | Local Passcode / PIN Protection (Device-level) | `UserSettings.securityEnabled`, `UserSettings.pinCode` |
| **Cloud Credential Storage** | None (No remote user accounts or passwords exist) | N/A |
| **Payment Secrets & Passwords** | Zero collection. PocketWise never prompts for UPI PINs, bank passwords, or debit card CVVs. | `MerchantCategorizer.cleanMerchantName`, `UPINotificationListenerService.kt` |
| **SMS Reading Permissions** | Avoided completely (`READ_SMS` / `RECEIVE_SMS` not requested). Compliant with strict Google Play SMS policies. | [app.json](file:///D:/Pocketwise/app.json), [plugins/withUpiDetector.js](file:///D:/Pocketwise/plugins/withUpiDetector.js) |
| **Notification Privacy** | Sensitive OTPs, passwords, and verification codes are filtered and discarded before parsing. | `BaseNotificationParser.isIgnorable` in `upiParser.ts` |

---

## 6. State Management Architecture

State is managed globally through **Zustand (`^5.0.15`)** in a single consolidated store [useAppStore.ts](file:///D:/Pocketwise/src/store/useAppStore.ts).

### Key Architectural Characteristics:
1. **Manual Hydration Lifecycle**:
   - `App.tsx` invokes `hydrate()` immediately upon mount while `SplashScreen.preventAutoHideAsync()` keeps the splash screen visible.
   - `hydrate()` executes a parallel `Promise.all` fetch across all `AsyncStorage` keys, synchronizes detected transactions from the native module, checks notification permissions, and sets `isHydrated: true`.
   - Once hydrated, `SplashScreen.hideAsync()` reveals the UI.
2. **Deterministic Derived Computations**:
   - Every transaction addition, update, or deletion automatically triggers `FinancialCalculationsService.calculateOverview()` and `InsightsService.generateInsights()`.
   - UI components receive pre-computed overview totals and insights without re-calculating aggregations on every render frame.
3. **Atomic Multi-Entity Updates**:
   - Adding a transaction of type `'saving'` automatically debits the linked bank account and credits the linked `SavingsGoal` within the same asynchronous action.
   - Deleting or updating a transaction reverses the balance differential on the associated accounts.

---

## 7. Cloud Services, Build & Deployment Stack

### 7.1 Continuous Native Generation (CNG) & Expo Prebuild
PocketWise leverages **Expo Config Plugins** to manage native Android code generation without requiring developers to check in brittle generated native files:
- **`plugins/withUpiDetector.js`**:
  - Injects `RECEIVE_BOOT_COMPLETED` and `POST_NOTIFICATIONS` permissions into `AndroidManifest.xml`.
  - Configures the native `UPINotificationListenerService` with `BIND_NOTIFICATION_LISTENER_SERVICE` permission.
  - Automatically copies all Kotlin source files from `src/native/android` into `android/app/src/main/java/com/pocketwise/upidetector/`.
  - Injects `UPITransactionDetectionPackage` registration into `MainApplication.kt`.

### 7.2 EAS Build Pipeline
- **EAS Project ID**: `db6674ea-3c16-41da-8ece-8426af9a7ac9` (configured in `app.json` and `eas.json`).
- **Build Configurations (`eas.json`)**:
  - `development`: Development client build (`developmentClient: true`) for debugging native code on physical devices.
  - `preview`: Internal distribution APK for device testing.
  - `production`: Release Android App Bundle (`.aab`) configured for Google Play Store publishing.

---

## 8. Package Dependency Matrix

| Package Name | Specified Version | Functional Role |
| :--- | :--- | :--- |
| `expo` | `~57.0.27` | Application core container and SDK runtime |
| `react` | `19.2.3` | User interface library |
| `react-native` | `0.86.3` | Cross-platform native runtime |
| `zustand` | `^5.0.15` | Global state store |
| `@react-native-async-storage/async-storage` | `2.2.0` | Client key-value persistence |
| `@react-navigation/native` | `^7.5.0` | App navigation controller |
| `@react-navigation/native-stack` | `^7.20.0` | Stack navigator |
| `@react-navigation/bottom-tabs` | `^7.20.0` | Tab bar navigator |
| `react-native-safe-area-context` | `~5.7.0` | Safe area insets calculator |
| `react-native-gesture-handler` | `~2.32.0` | Native gesture dispatcher |
| `react-native-reanimated` | `4.5.1` | Native animations |
| `react-native-worklets` | `0.10.1` | UI thread execution engine |
| `@expo/vector-icons` | `^15.0.2` | Feather icon library |
| `react-native-svg` | `15.15.4` | SVG rendering |
| `expo-splash-screen` | `~57.0.9` | Startup splash screen control |
| `expo-font` | `~57.0.4` | Font asset loading |
| `expo-status-bar` | `~57.0.1` | Device status bar styler |
| `react-native-web` | `^0.21.2` | Web fallback support |
| `jest` | `~29.7.0` | Unit test runner |
| `ts-jest` | `^29.4.14` | TypeScript preprocessor for Jest |
| `typescript` | `~6.0.3` | Static typing and compiler |

