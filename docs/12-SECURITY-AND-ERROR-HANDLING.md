# Phase 11: Security, Privacy & Error Handling Audit — PocketWise

This document delivers a thorough security, privacy, and architectural resilience audit of PocketWise, distinguishing confirmed codebase issues from theoretical security risks.

---

## 1. Security Architecture & Threat Model

```
Threat Model Boundary
┌────────────────────────────────────────────────────────┐
│ Device Hardware Sandbox (Android OS / iOS Sandbox)    │
│                                                        │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │ PocketWise Client UI │<-->│ Zustand In-Memory    │  │
│  └──────────┬───────────┘    └──────────┬───────────┘  │
│             │                           │              │
│  ┌──────────▼───────────┐    ┌──────────▼───────────┐  │
│  │ Local AsyncStorage   │    │ Native Android       │  │
│  │ (@pocketwise_*_v2)   │    │ SharedPreferences    │  │
│  └──────────────────────┘    └──────────────────────┘  │
│                                                        │
│  ════════════════════ NO OUTBOUND NETWORK ═══════════  │
└────────────────────────────────────────────────────────┘
                       No Remote Cloud Attack Surface
```

---

## 2. Granular Security Evaluations

### 2.1 Authentication & Authorization Security
- **Current Architecture**: Single-user local profile.
- **Credential Storage**: No cloud passwords, tokens, or hashed secrets are stored because no cloud server exists.
- **Navigation Authorization**: Controlled via `RootNavigator.tsx`. Un-onboarded users are strictly confined to `OnboardingScreen` and cannot access financial routes.
- **Audit Assessment**: Suitable for personal finance trackers that avoid cloud multi-tenancy.

### 2.2 Sensitive Financial Data & Notification Privacy
- **UPI PINs & Banking Secrets**: PocketWise never prompts for, reads, or stores UPI PINs, net banking credentials, or card CVVs.
- **OTP Filtering Engine**: Implemented in [upiParser.ts](file:///D:/Pocketwise/src/services/upiParser.ts#L142-L147) and [UPINotificationListenerService.kt](file:///D:/Pocketwise/src/native/android/service/UPINotificationListenerService.kt).
  - Explicitly detects and rejects strings containing `"otp"`, `"verification code"`, `"one time password"`, `"secret otp"`, `"do not share"`.
  - Discards these notifications before parsing or persistence occurs.
- **Privacy Logging**: The native Android service logs only sanitized metadata:
  ```kotlin
  Log.i(TAG, "Detected UPI payment: amount=₹${detected.amount}, merchant=${detected.merchant}, provider=${detected.paymentProvider}")
  ```
  No raw text or sensitive payloads are written to system logs.

### 2.3 Input Validation & Sanitization
Input controls across all screens enforce strict type and boundary validations:
- **Numeric Amounts**: Cleaned of commas via `.replace(/,/g, '')` and verified via `isNaN(amount) || amount <= 0`.
- **String Descriptions**: Trimmed via `.trim()`. Blank inputs are rejected or assigned safe defaults (`'Cash'`, `'Unknown Payee'`).
- **Internal Transfers**: [TransferModal.tsx](file:///D:/Pocketwise/src/components/modals/TransferModal.tsx) validates that `fromAccountId !== toAccountId`.
- **Goal Withdrawals**: [WithdrawGoalFundsModal.tsx](file:///D:/Pocketwise/src/components/modals/WithdrawGoalFundsModal.tsx) enforces `amount <= goal.currentAmount`.
- **JSON Backup Ingestion**: [ExportImportService.ts](file:///D:/Pocketwise/src/services/exportImportService.ts) performs structural schema validation on parsed objects, verifying array types and essential entity fields (`id`, `name`, `balance`, `amount`).

### 2.4 Database & Filesystem Security
- **Data Location**: Client records are persisted in the sandboxed local directory:
  - Android: `/data/data/com.taha_911.pocketwise/files/`
- **Native SharedPreferences**: Written using `Context.MODE_PRIVATE`, restricting access exclusively to the PocketWise application process UID.

---

## 3. Error Handling & Resilience Mechanisms

### 3.1 Fault-Tolerant Persistence (`StorageService.ts`)
All reads, writes, and clears in [StorageService.ts](file:///D:/Pocketwise/src/storage/storageService.ts) are wrapped in defensive `try...catch` blocks:
- If a JSON parse error or disk read failure occurs, `StorageService.getItem` logs a warning and returns the supplied `defaultValue` without throwing an unhandled exception.
- The user interface is protected from crashing due to disk corruption.

### 3.2 Native Background Crash Prevention
In [UPINotificationListenerService.kt](file:///D:/Pocketwise/src/native/android/service/UPINotificationListenerService.kt#L35-L41):
```kotlin
override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    try {
        processNotification(sbn)
    } catch (e: Throwable) {
        // Never crash the host application due to unexpected notification format
        Log.e(TAG, "Safe catch: error processing notification: ${e.message}")
    }
}
```
Any unexpected payload variation from third-party banking apps is caught safely, preventing service crashes or application force-closes.

### 3.3 Mathematical Resilience (`financialCalculations.ts`)
- Division-by-zero is safeguarded across all calculation methods:
  - `calculateSavingsRate(income, savings)`: Returns `0` if `income <= 0`.
  - `calculateGrowthPercentage(current, previous)`: Returns `100` if `current > 0` and `previous === 0`.
  - `calculateBudgetPerformance`: Returns `0` percentage if `budget.amount <= 0`.

---

## 4. Confirmed Issues vs. Potential Security Risks

### 4.1 Confirmed Codebase Issues
1. **Unenforced Local App Security (PIN Lock)**:
   - *Finding*: `UserSettings.securityEnabled` and `pinCode` exist and can be toggled in `ProfileScreen.tsx`, but there is currently no blocking `PinLockScreen` mounted in `RootNavigator.tsx`. Toggling security does not currently gate access to the app on cold launch.
   - *Severity*: Moderate (UX / Security mismatch).
2. **TypeScript Compilation Warning in `App.tsx`**:
   - *Finding*: Line 34 of `App.tsx` specifies `<StatusBar style="dark" translucent />`. In Expo Status Bar props, `translucent` is not recognized, causing a typecheck error during `npm run typecheck`.
   - *Severity*: Low (Type warning only; runtime is unaffected).

### 4.2 Potential Risks & Future Hardening Recommendations
1. **Unencrypted Storage on Rooted Devices**:
   - *Risk*: `AsyncStorage` stores data in plain-text JSON within the application's private app directory. On rooted Android or jailbroken iOS devices, a superuser can inspect `/data/data/com.taha_911.pocketwise/`.
   - *Hardening Recommendation*: For higher security, sensitive account numbers or balances could be encrypted at rest using `expo-secure-store` or SQLCipher.
2. **Unsigned JSON Backup Files**:
   - *Risk*: When a user exports their data to JSON, the resulting text can be manually edited before being re-imported, allowing a user to inject artificial balances.
   - *Hardening Recommendation*: Generate an HMAC-SHA256 signature hash alongside the exported backup to verify data integrity upon re-import.

