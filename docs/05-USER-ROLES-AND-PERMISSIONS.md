# Phase 4: User Roles, Permissions & Security Architecture — PocketWise

## 1. Architectural Model: Standalone Single-User Client

PocketWise is engineered as a **100% offline-first, single-user on-device personal application**. 

Because PocketWise does not maintain a centralized remote database or multi-tenant cloud backend, traditional web application constructs—such as remote JSON Web Tokens (JWT), session cookies, OAuth2 identity providers, server-side authorization middleware, and remote role-based access control (RBAC)—do not exist in the codebase.

```
Access State Flow
┌────────────────────────┐
│ Application Launched   │
└───────────┬────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ settings.hasCompletedOnboarding?    │
└───────┬──────────────────────┬───────┘
        │ NO                   │ YES
        ▼                      ▼
┌─────────────────┐    ┌─────────────────────────────────┐
│ OnboardingScreen│    │ settings.securityEnabled?       │
└─────────────────┘    └───────┬─────────────────┬───────┘
                               │ NO              │ YES
                               ▼                 ▼
                       ┌───────────────┐ ┌──────────────────────┐
                       │ Main Dashboard│ │ Local PIN Lock State │
                       └───────────────┘ └──────────────────────┘
```

---

## 2. User Lifecycle & Authentication Processes

### 2.1 Registration Process (Local Onboarding)
- **Mechanism**: Local state initialization in [OnboardingScreen.tsx](file:///D:/Pocketwise/src/screens/onboarding/OnboardingScreen.tsx).
- **Credentials Required**: None. No email address, phone number, password, or cloud identity is requested.
- **Data Captured**:
  - Display Name (`userName: string`)
  - Preferred Currency (`currency: string`, `currencySymbol: string`)
  - Monthly Income Bracket (`monthlyIncomeRange: string`)
  - Primary Financial Target (`mainSavingsGoal: string`)
  - Savings Percentage Target (`preferredSavingTarget: number`)
  - Primary Financial Account (`name`, `type`, `balance`)
- **Execution**: On tapping "Get Started", the store action `useAppStore.completeOnboarding()` persists these fields to `@pocketwise_settings_v2` and toggles `hasCompletedOnboarding: true`.

### 2.2 Login & Session Management
- **Session Lifespan**: Infinite local session. There is no session expiration or token refresh cycle.
- **Hydration Gatekeeper**: On app launch, [App.tsx](file:///D:/Pocketwise/App.tsx) executes `useAppStore.hydrate()`.
- **Navigation Guard**: [RootNavigator.tsx](file:///D:/Pocketwise/src/navigation/RootNavigator.tsx#L37-L49) evaluates `hasCompletedOnboarding`:
  - If `false`: Only the `Onboarding` stack screen is mounted. The tab navigator and all financial features cannot be navigated to.
  - If `true`: The stack mounts `MainTabs`, `TransactionDetail`, `Reports`, `Recurring`, `Calendar`, `Accounts`, and `AutomaticDetectionSettings`.

### 2.3 Password Reset & Account Recovery
- **Cloud Recovery**: Not applicable (no remote server holds user data).
- **Data Migration & Recovery**: Handled entirely through local cryptographic/file export:
  - Users can export a complete JSON snapshot via `ExportImportService.exportToJSON()`.
  - Backups can be restored on any device running PocketWise via `ExportImportService.validateAndParseImportJSON()`.
- **Full Account Wipe**: Users can reset the application to its pristine zero-state at any time via the "Reset All Data" action in [ProfileScreen.tsx](file:///D:/Pocketwise/src/screens/profile/ProfileScreen.tsx#L29), which invokes `StorageService.clearAll()` and resets Zustand to defaults.

---

## 3. User Roles in PocketWise

While there are no enterprise RBAC hierarchies (such as Super Admin, Tenant Admin, Auditor), the application recognizes three distinct **Operational User States**:

| Role / Operational State | Description | Access Boundaries |
| :--- | :--- | :--- |
| **Un-onboarded User (Guest)** | A first-time user who has just installed the application and has not initialized their local profile. | Confined strictly to `OnboardingScreen`. Cannot access the dashboard, ledger, budgets, savings vaults, or settings. |
| **Active Owner (Authenticated User)** | The device owner who has completed setup. | Full read/write access to all accounts, transactions, budgets, recurring commitments, and settings. |
| **Protected Device User (PIN Guarded)** | An active owner who has toggled `securityEnabled: true` in settings. | Intended to restrict access to local screens until the local device PIN/biometric verification succeeds. |

---

## 4. Role-Permission Matrix

| Application Feature / Operation | Un-onboarded User | Active Owner | Protected Owner (Locked) |
| :--- | :---: | :---: | :---: |
| **View Onboarding Showcase** | Allowed | Hidden | Hidden |
| **Initialize Profile & Accounts** | Allowed | Hidden | Hidden |
| **View Dashboard & Net Worth** | Denied | Allowed | Gated by PIN |
| **Create / Edit / Delete Transactions** | Denied | Allowed | Gated by PIN |
| **Perform Account-to-Account Transfers** | Denied | Allowed | Gated by PIN |
| **Manage Category Budgets & Thresholds** | Denied | Allowed | Gated by PIN |
| **Contribute / Withdraw Savings Goal Funds** | Denied | Allowed | Gated by PIN |
| **Manage Recurring Payments & Subscriptions** | Denied | Allowed | Gated by PIN |
| **Review / Confirm / Reject UPI Payments** | Denied | Allowed | Gated by PIN |
| **Grant Android Notification Access** | Denied | Allowed | Allowed (OS Settings) |
| **Export Data (JSON / CSV)** | Denied | Allowed | Gated by PIN |
| **Import & Restore JSON Backup** | Denied | Allowed | Gated by PIN |
| **Reset App Data to Factory Defaults** | Denied | Allowed | Gated by PIN |

---

## 5. Security & Authorization Implementation Audit

### 5.1 Local Security Feature Analysis
In [src/types/index.ts](file:///D:/Pocketwise/src/types/index.ts#L154-L155), the `UserSettings` interface defines two local security fields:
```typescript
export interface UserSettings {
  // ...
  securityEnabled: boolean;
  pinCode?: string;
  // ...
}
```
In [ProfileScreen.tsx](file:///D:/Pocketwise/src/screens/profile/ProfileScreen.tsx), a UI switch allows the user to toggle `securityEnabled`.

> [!WARNING]
> **Implementation Audit Finding — Local PIN Lock Screen**:
> While `securityEnabled` and `pinCode` exist in `UserSettings` and can be toggled in `ProfileScreen`, the codebase currently lacks a dedicated `PinLockScreen` or biometric unlock prompt component in `RootNavigator.tsx`. Toggling `securityEnabled: true` updates the local setting in `AsyncStorage`, but does not currently block rendering of `MainTabs` on cold boot. This represents a known technical limitation and incomplete security workflow documented in Phase 12.

### 5.2 Android OS-Level Permission Boundaries
The Android native layer uses operating system permission boundaries to govern automatic detection:
- **`BIND_NOTIFICATION_LISTENER_SERVICE`**: Required for `UPINotificationListenerService.kt`. This permission cannot be granted silently via app code; the user must explicitly toggle PocketWise on in the Android System "Notification Access" settings screen.
- **`POST_NOTIFICATIONS`**: Android 13+ runtime permission declared in `plugins/withUpiDetector.js` to dispatch local notifications.
- **`RECEIVE_BOOT_COMPLETED`**: Declared to allow native listener re-binding when the Android device reboots.

