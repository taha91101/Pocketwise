# Phase 5: Complete API & Native Interface Documentation — PocketWise

Because PocketWise is an offline-first mobile application without an external cloud REST or GraphQL server, its API architecture consists of five distinct interface boundaries:
1. **React Native Bridge Native Module API (`UPITransactionDetectionModule`)**: 12 native Kotlin methods exposed to JavaScript via `@ReactMethod`.
2. **Native Event Emitters & OS Broadcast Intents**: 3 asynchronous event streams and 1 Android system broadcast.
3. **Application Store Action Interface (`useAppStore.ts`)**: 30 state mutation and orchestration endpoints.
4. **Domain Calculation & Business Intelligence Service APIs**: 13 financial calculation methods, 1 insights generator, and 1 notification evaluator.
5. **Data Serialization & Migration APIs (`ExportImportService.ts` & `StorageService.ts`)**: 3 backup/restore methods and 4 storage persistence methods.

---

## 1. React Native Bridge API (`UPITransactionDetectionModule`)

Implemented in [src/native/android/module/UPITransactionDetectionModule.kt](file:///D:/Pocketwise/src/native/android/module/UPITransactionDetectionModule.kt) and consumed in TypeScript via [src/services/upiDetectionService.ts](file:///D:/Pocketwise/src/services/upiDetectionService.ts).

### Endpoint Inventory

| # | Method Signature | Bridge Interface | Return Type | Purpose |
| :-: | :--- | :--- | :--- | :--- |
| **1** | `isNotificationAccessGranted(promise)` | `@ReactMethod` | `Promise<boolean>` | Checks if Android Notification Listener permission is granted |
| **2** | `openNotificationAccessSettings(promise)`| `@ReactMethod` | `Promise<boolean>` | Launches Android OS Notification Access settings screen |
| **3** | `isDetectionEnabled(promise)` | `@ReactMethod` | `Promise<boolean>` | Reads background detection toggle from native storage |
| **4** | `setDetectionEnabled(enabled, promise)` | `@ReactMethod` | `Promise<boolean>` | Updates background detection toggle in native storage |
| **5** | `isAutoConfirmEnabled(promise)` | `@ReactMethod` | `Promise<boolean>` | Reads auto-confirm high confidence preference |
| **6** | `setAutoConfirmEnabled(enabled, promise)`| `@ReactMethod` | `Promise<boolean>` | Updates auto-confirm high confidence preference |
| **7** | `getSupportedPaymentApps(promise)` | `@ReactMethod` | `Promise<SupportedPaymentApp[]>` | Returns list of configured UPI apps from `ParserRegistry` |
| **8** | `getDetectedTransactions(promise)` | `@ReactMethod` | `Promise<DetectedTransaction[]>` | Fetches all detected transactions from `SharedPreferences` |
| **9** | `confirmDetectedTransaction(id, promise)`| `@ReactMethod` | `Promise<boolean>` | Marks detected payment as `'CONFIRMED'` in native storage |
| **10**| `rejectDetectedTransaction(id, promise)` | `@ReactMethod` | `Promise<boolean>` | Marks detected payment as `'REJECTED'` in native storage |
| **11**| `clearDetectedTransactions(promise)` | `@ReactMethod` | `Promise<boolean>` | Purges native detected transaction cache |
| **12**| `simulateTestNotification(pkg, title, text, promise)` | `@ReactMethod` | `Promise<DetectedTransaction>` | Injects synthetic test notification for verification |

---

### Method Specifications

#### 1. `isNotificationAccessGranted()`
- **Purpose**: Verifies whether `NotificationManagerCompat.getEnabledListenerPackages(context)` contains the PocketWise application package (`com.taha_911.pocketwise`).
- **Parameters**: None.
- **Return Type**: `Promise<boolean>`
- **Response**: `true` or `false`.

#### 2. `openNotificationAccessSettings()`
- **Purpose**: Fires an Android system intent:
  ```kotlin
  Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
  }
  ```
- **Parameters**: None.
- **Return Type**: `Promise<boolean>`
- **Error Handling**: Rejects with `SETTINGS_ERROR` if the device settings activity cannot be resolved.

#### 3. `isDetectionEnabled()` & 4. `setDetectionEnabled(enabled: Boolean)`
- **Purpose**: Controls whether [UPINotificationListenerService.kt](file:///D:/Pocketwise/src/native/android/service/UPINotificationListenerService.kt) actively parses status bar notifications or exits early.
- **Parameters (Setter)**: `enabled: Boolean`.
- **Return Type**: `Promise<boolean>`.
- **Database Operation**: Reads/writes `pocketwise_upi_storage -> detection_enabled`.

#### 5. `isAutoConfirmEnabled()` & 6. `setAutoConfirmEnabled(enabled: Boolean)`
- **Purpose**: Controls whether incoming payments with `detectionConfidence >= 0.85` bypass manual review and automatically debit accounts.
- **Parameters (Setter)**: `enabled: Boolean`.
- **Return Type**: `Promise<boolean>`.
- **Database Operation**: Reads/writes `pocketwise_upi_storage -> auto_confirm_high_confidence`.

#### 7. `getSupportedPaymentApps()`
- **Purpose**: Returns the active parsing rules and package metadata registered in [ParserRegistry.kt](file:///D:/Pocketwise/src/native/android/parser/ParserRegistry.kt).
- **Return Structure**:
  ```json
  [
    { "packageName": "com.google.android.apps.nbu.paisa.user", "displayName": "Google Pay", "isEnabled": true },
    { "packageName": "com.phonepe.app", "displayName": "PhonePe", "isEnabled": true },
    { "packageName": "net.one97.paytm", "displayName": "Paytm", "isEnabled": true },
    { "packageName": "in.org.npci.upiapp", "displayName": "BHIM UPI", "isEnabled": true },
    { "packageName": "in.amazon.mShop.android.shopping", "displayName": "Amazon Pay", "isEnabled": true },
    { "packageName": "com.dreamplug.androidapp", "displayName": "CRED", "isEnabled": true }
  ]
  ```

#### 8. `getDetectedTransactions()`
- **Purpose**: Retrieves all serialized JSON entities stored in native Android cache (capped at 200 items in a ring buffer).
- **Return Type**: `Promise<DetectedTransaction[]>`.

#### 9. `confirmDetectedTransaction(id: String)` & 10. `rejectDetectedTransaction(id: String)`
- **Purpose**: Updates the record status to `'CONFIRMED'` or `'REJECTED'`, persists to SharedPreferences, and emits the corresponding bridge event.
- **Parameters**: `id: String` (e.g. `"upi-1718000000000-a1b2c3"`).
- **Return Type**: `Promise<boolean>`.

#### 11. `clearDetectedTransactions()`
- **Purpose**: Clears the `detected_transactions` key in native SharedPreferences.
- **Return Type**: `Promise<boolean>`.

#### 12. `simulateTestNotification(packageName: String, title: String, text: String)`
- **Purpose**: Bypasses the physical notification listener to test end-to-end parsing, deduplication, and state updates.
- **Parameters**:
  - `packageName`: Target app package (e.g. `"com.phonepe.app"`).
  - `title`: Notification title (e.g. `"Payment to Starbucks successful"`).
  - `text`: Notification body (e.g. `"₹350 paid using UPI. Ref: 419200384729"`).
- **Error Codes**:
  - `UNSUPPORTED_APP`: No parser found for the specified package.
  - `PARSE_ERROR`: Notification content does not match a valid completed payment.
  - `DUPLICATE`: Transaction matched an identical deduplication hash within the 5-minute cache window.

---

## 2. Event Emitters & OS Broadcast Interfaces

### 2.1 React Native Bridge Event Emitters (`RCTDeviceEventEmitter`)
The native module dispatches real-time events to JavaScript via `DeviceEventManagerModule`:

1. **`UPI_TRANSACTION_DETECTED`**:
   - **Trigger**: Emitted whenever a new, non-duplicate UPI payment is intercepted and parsed by `UPINotificationListenerService.kt`.
   - **Payload**: Serialized JSON string of the `DetectedTransaction` entity.
   - **Handler in JS**: `useAppStore.processIncomingDetectedTransaction(incomingTx)`.
2. **`UPI_TRANSACTION_CONFIRMED`**:
   - **Trigger**: Emitted when a detected transaction is confirmed.
   - **Payload**: `id: string`.
3. **`UPI_TRANSACTION_REJECTED`**:
   - **Trigger**: Emitted when a detected transaction is rejected/dismissed.
   - **Payload**: `id: string`.

### 2.2 Android System Broadcast Intent
In addition to the React Native event bridge, `UPINotificationListenerService.kt` fires an explicit Android system broadcast:
- **Action**: `com.pocketwise.ACTION_UPI_NOTIFICATION_DETECTED`
- **Extra Key**: `transaction_json`
- **Target Package**: `context.packageName` (Sandboxed to PocketWise)
- **Purpose**: Allows background broadcast receivers to receive detected payments even if the React Native bridge instance is not actively attached.

---

## 3. Zustand Global Store Action API (`useAppStore.ts`)

Located in [src/store/useAppStore.ts](file:///D:/Pocketwise/src/store/useAppStore.ts).

```
useAppStore Action Modules
├── Initialization & Sync (3 actions)
├── Transactions Management (4 actions)
├── Accounts & Transfers (4 actions)
├── Category Budgets (3 actions)
├── Savings Goals (5 actions)
├── Recurring Payments (4 actions)
├── Settings & Onboarding (4 actions)
└── Automatic Detection (6 actions)
```

### 3.1 Initialization & Sync Actions (3 actions)
1. **`hydrate(): Promise<void>`**: Fetches all storage keys in parallel, syncs native detected transactions, checks notification permission status, calculates overview and insights, and sets `isHydrated: true`.
2. **`resetToDefaults(): Promise<void>`**: Clears all local AsyncStorage keys, resets Zustand to clean factory defaults, and recalculates initial empty overviews.
3. **`importData(data: AppExportData): Promise<boolean>`**: Overwrites accounts, transactions, budgets, goals, recurring payments, and settings from a validated backup, persisting all keys in parallel.

### 3.2 Transaction Actions (4 actions)
4. **`addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>`**: Creates transaction with UUID, auto-creates default `'Cash'` account if accounts array is empty, adjusts account balance (debit/credit), updates linked savings goal, recalculates overview/insights, and persists.
5. **`updateTransaction(id: string, updated: Partial<Transaction>): Promise<boolean>`**: Reverses the previous transaction balance impact, applies updated balance values, and recalculates overviews.
6. **`deleteTransaction(id: string): Promise<boolean>`**: Rolls back balance on the linked account, rolls back linked savings goal amount, and removes transaction.
7. **`duplicateTransaction(id: string): Promise<Transaction | null>`**: Clones transaction data, sets current date/time, and invokes `addTransaction()`.

### 3.3 Account & Transfer Actions (4 actions)
8. **`addAccount(account: Omit<Account, 'id'>): Promise<Account>`**: Appends new account and updates net liquid overview.
9. **`updateAccount(id: string, updated: Partial<Account>): Promise<boolean>`**: Updates account name, type, or balance.
10. **`deleteAccount(id: string): Promise<boolean>`**: Removes account from active list and recalculates net worth.
11. **`transferBetweenAccounts(fromId: string, toId: string, amount: number, notes?: string): Promise<boolean>`**: Logs an internal transaction of type `'transfer'`, debits source account, and credits destination account.

### 3.4 Category Budget Actions (3 actions)
12. **`addBudget(budget: Omit<Budget, 'id'>): Promise<Budget>`**: Creates budget ceiling and triggers insights regeneration.
13. **`updateBudget(id: string, updated: Partial<Budget>): Promise<boolean>`**: Modifies limit amount or alert threshold.
14. **`deleteBudget(id: string): Promise<boolean>`**: Removes budget and recalculates insights.

### 3.5 Savings Goal Actions (5 actions)
15. **`addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<SavingsGoal>`**: Creates target goal.
16. **`updateSavingsGoal(id: string, updated: Partial<SavingsGoal>): Promise<boolean>`**: Modifies goal target amount or date.
17. **`deleteSavingsGoal(id: string): Promise<boolean>`**: Removes goal.
18. **`contributeToGoal(goalId: string, accountId: string, amount: number, notes?: string): Promise<boolean>`**: Debits funding account, credits goal, marks `isCompleted: true` if target reached, and logs `'saving'` transaction.
19. **`withdrawFromGoal(goalId: string, accountId: string, amount: number, notes?: string): Promise<boolean>`**: Deducts from goal, credits destination account, and logs `'income'` withdrawal transaction.

### 3.6 Recurring Payment Actions (4 actions)
20. **`addRecurringPayment(payment: Omit<RecurringPayment, 'id' | 'createdAt'>): Promise<RecurringPayment>`**: Creates recurring bill commitment.
21. **`updateRecurringPayment(id: string, updated: Partial<RecurringPayment>): Promise<boolean>`**: Updates due date, amount, or frequency.
22. **`deleteRecurringPayment(id: string): Promise<boolean>`**: Removes recurring bill.
23. **`toggleRecurringPayment(id: string): Promise<boolean>`**: Flips `isActive` boolean flag.

### 3.7 Settings & Onboarding Actions (4 actions)
24. **`updateSettings(updated: Partial<UserSettings>): Promise<void>`**: Persists settings and recalibrates insights with updated currency symbol.
25. **`completeOnboarding(data: Partial<UserSettings>): Promise<void>`**: Sets `hasCompletedOnboarding: true` and commits personalization.
26. **`completeWalkthrough(): Promise<void>`**: Sets `hasCompletedWalkthrough: true`.
27. **`restartWalkthrough(): Promise<void>`**: Sets `hasCompletedWalkthrough: false` to re-trigger guided tour.

### 3.8 Automatic Detection Actions (6 actions)
28. **`syncDetectedTransactions(): Promise<void>`**: Fetches native detections, merges with local state by ID (most recent first), and persists.
29. **`processIncomingDetectedTransaction(detected: DetectedTransaction): Promise<Transaction | null>`**: Evaluates notification preferences. If auto-confirm is enabled and confidence $\ge 0.85$, auto-commits transaction; otherwise queues it in `detectedTransactions` with status `'DETECTED'`.
30. **`confirmDetectedTransaction(id: string, edits?: Partial<Transaction>): Promise<Transaction | null>`**: Converts detected record to standard ledger transaction input, calls `addTransaction()`, and calls native `confirmDetectedTransaction()`.
31. **`rejectDetectedTransaction(id: string): Promise<boolean>`**: Marks status `'REJECTED'` in native storage and local state.
32. **`clearDetectedTransactions(): Promise<void>`**: Clears native and local detected transaction lists.
33. **`checkNotificationAccessStatus(): Promise<boolean>`**: Queries native module and updates `isNotificationAccessGranted`.

---

## 4. Domain Service & Calculation APIs

### 4.1 Financial Calculations Engine (`FinancialCalculationsService.ts`)
Located in [src/services/financialCalculations.ts](file:///D:/Pocketwise/src/services/financialCalculations.ts). Pure mathematical functions:

| Method Name | Input Parameters | Output Return Type | Mathematical Formula / Business Rule |
| :--- | :--- | :--- | :--- |
| `calculateTotalIncome` | `(transactions, start?, end?)` | `number` | Sum of `amount` where `type === 'income'`. Transfers and savings excluded. |
| `calculateTotalExpenses`| `(transactions, start?, end?)` | `number` | Sum of `amount` where `type === 'expense'`. Transfers and savings excluded. |
| `calculateTotalSavingsAllocated` | `(transactions, start?, end?)` | `number` | Sum of `amount` where `type === 'saving'`. |
| `calculateTotalGoalSavings` | `(goals)` | `number` | Sum of `goal.currentAmount` across all goals. |
| `calculateTotalAccountBalance` | `(accounts)` | `number` | Sum of `acc.balance` across all accounts. |
| `calculateSavingsRate` | `(income, savings)` | `number` (%) | $(\text{savings} / \text{income}) \times 100$. Clamped between $0$ and $100$. |
| `calculateGrowthPercentage` | `(current, previous)` | `number` (%) | $((\text{current} - \text{previous}) / \|\text{previous}\|) \times 100$. |
| `calculateOverview` | `(accounts, tx, goals, monthDate?)` | `FinancialOverview` | Aggregates income, expenses, savings rate, month-over-month growth, and liquid balances. |
| `calculateCategoryBreakdown` | `(tx, start?, end?)` | `CategoryBreakdownItem[]` | Groups expenses by category, sorts descending by amount, computes percentage share. |
| `calculateBudgetPerformance` | `(budget, tx)` | `BudgetPerformance` | Evaluates spent vs. limit, computes `percentageUsed`, assigns status (`normal`, `warning` $\ge 80\%$, `exceeded` $\ge 100\%$). |
| `calculateGoalMetrics` | `(goal)` | `GoalMetrics` | Computes `remainingAmount`, `progressPercentage`, `monthsRemaining`, and `requiredMonthly`. |
| `processAccountTransfer` | `(accounts, fromId, toId, amount)` | `{ updatedAccounts, error? }` | Debits source account and credits destination account with validation. |
| `formatCurrency` | `(amount, symbol?)` | `string` | Formats number with Indian comma grouping (`en-IN`) and currency symbol (e.g. `"₹52,450"`). |

---

### 4.2 Financial Insights Engine (`InsightsService.ts`)
- **`generateInsights(tx, accounts, budgets, goals, currencySymbol): FinancialInsight[]`**
  - Evaluates month-over-month spending acceleration.
  - Identifies top expense category. If discretionary (Food, Shopping, Entertainment), simulates a 20% trim and generates a `Smart Save` card.
  - Benchmarks savings rate against the 50/30/20 financial rule.
  - Computes daily burn rate average (`totalExpenses / dayOfMonth`).
  - Emits budget overspending warnings and goal milestone achievements.

### 4.3 In-App Notification Service (`NotificationService.ts`)
- **`checkAndGenerateNotifications(settings, budgets, tx, recurring, goals, currencySymbol): AppNotification[]`**
  - Evaluates active budgets exceeding 80% or 100%.
  - Evaluates recurring payments due within `reminderDaysBefore` days.
  - Evaluates completed savings goal milestones.

---

## 5. Storage & Persistence APIs

### 5.1 Storage Service (`StorageService.ts`)
- **`getItem<T>(key: string, defaultValue: T): Promise<T>`**: Reads from `AsyncStorage`, parses JSON, returns `defaultValue` on error or null.
- **`setItem<T>(key: string, value: T): Promise<boolean>`**: Serializes to JSON and writes to `AsyncStorage`.
- **`removeItem(key: string): Promise<boolean>`**: Deletes key from `AsyncStorage`.
- **`clearAll(): Promise<boolean>`**: Calls `AsyncStorage.clear()`.

### 5.2 Export & Import Serialization Service (`ExportImportService.ts`)
- **`exportToJSON(data: AppExportData): string`**: Generates clean, 2-space indented JSON export.
- **`exportTransactionsToCSV(transactions: Transaction[]): string`**: Generates RFC 4180 CSV spreadsheet.
- **`validateAndParseImportJSON(jsonString: string)`**: Parses and validates structural schema for JSON backup restoration.
