# Phase 7: End-to-End Business Logic & Workflows — PocketWise

This document diagrams the complete lifecycle of core business operations in PocketWise, detailing every hop from user touch event through UI validation, Zustand state mutation, native Android service execution, database persistence, and visual recalculation.

---

## Workflow 1: End-to-End Expense Logging & Account Balance Debit

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Modal as AddTransactionModal
    participant Store as useAppStore
    participant Storage as StorageService (AsyncStorage)
    participant Calc as FinancialCalculationsService
    participant Insights as InsightsService
    participant UI as Dashboard & Ledger Screens

    User->>Modal: Tap "+ Expense" & Enter Details (Amount, Title, Category, Account)
    User->>Modal: Tap "Save Transaction"
    Modal->>Modal: Validate Amount > 0 & Title not empty
    Modal->>Store: addTransaction(txData)
    Note over Store: 1. Generate unique id: tx-<timestamp>-<rand><br/>2. If no accounts, auto-create default 'Cash'<br/>3. Deduct amount from Account.balance
    Store->>Storage: setItem(@pocketwise_transactions_v2, [newTx, ...existing])
    Store->>Storage: setItem(@pocketwise_accounts_v2, updatedAccounts)
    Store->>Calc: calculateOverview(updatedAccounts, updatedTx, goals)
    Calc-->>Store: newOverview
    Store->>Insights: generateInsights(updatedTx, updatedAccounts, budgets, goals)
    Insights-->>Store: newInsights
    Store-->>Modal: return newTx
    Modal->>Modal: Reset inputs & onClose()
    Store-->>UI: State update triggers re-render
    UI-->>User: Balance Card debited, Recent Transactions updated, Spending Chart refreshed
```

### Detailed Trace:
1. **Starting Point**: User taps `+ Expense` in [DashboardScreen.tsx](file:///D:/Pocketwise/src/screens/dashboard/DashboardScreen.tsx) or [TransactionsScreen.tsx](file:///D:/Pocketwise/src/screens/transactions/TransactionsScreen.tsx).
2. **User Action**: Fills amount (e.g. `₹350`), title (`"Lunch at Bistro"`), selects category (`Food & Dining`), selects account (`HDFC Salary`), and taps "Save Transaction".
3. **Frontend Processing**: [AddTransactionModal.tsx](file:///D:/Pocketwise/src/components/modals/AddTransactionModal.tsx#L80) validates that `numAmount > 0` and `title.trim()` is not blank.
4. **Store Action**: `useAppStore.addTransaction()` in [useAppStore.ts](file:///D:/Pocketwise/src/store/useAppStore.ts#L279).
5. **Business Logic & Balance Update**:
   - Matches `acc.id === newTx.accountId` and calculates:
     $$\text{Account.balance} \leftarrow \text{Account.balance} - 350$$
6. **Database Persistence**: Writes in parallel via `Promise.all` to `@pocketwise_transactions_v2` and `@pocketwise_accounts_v2`.
7. **Recalibration**: Invokes `calculateOverview()` and `generateInsights()`.
8. **Result Shown to User**: Modal closes smoothly, Available Balance is decremented by ₹350, the transaction appears at the top of the transaction list, and the monthly budget utilization bar advances.

---

## Workflow 2: Background Automatic UPI Payment Ingestion & Review

```mermaid
flowchart TD
    A["User makes UPI payment via Google Pay / PhonePe / Paytm"] --> B["Android OS posts Notification to Status Bar"]
    B --> C["UPINotificationListenerService.onNotificationPosted()"]
    C --> D{"isDetectionEnabled?"}
    D -- No --> Stop1["Exit"]
    D -- Yes --> E["ParserRegistry.findParser(packageName)"]
    E --> F{"Parser found?"}
    F -- No --> Stop2["Exit"]
    F -- Yes --> G["App Parser (e.g. PhonePeParser) extracts Amount, Merchant, UTR"]
    G --> H{"Noise or Failure?"}
    H -- Yes (OTP / Fail / Collect) --> Stop3["Discard notification"]
    H -- No --> I["MerchantCategorizer: Cleans Payee & Maps Category"]
    I --> J["DuplicateDetector: Calculate SHA-256 Key"]
    J --> K{"Is duplicate in cache?"}
    K -- Yes --> Stop4["Drop duplicate silently"]
    K -- No --> L["DuplicateDetector.markAsProcessed()"]
    L --> M["DetectedTransactionStorage.saveTransaction() (SharedPreferences)"]
    M --> N["UPITransactionDetectionModule.notifyTransactionDetected()"]
    N --> O["React Native Bridge emits 'UPI_TRANSACTION_DETECTED'"]
    O --> P["useAppStore.processIncomingDetectedTransaction()"]
    P --> Q{"Auto-Confirm enabled AND confidence >= 0.85?"}
    Q -- Yes --> R["useAppStore.addTransaction() & confirmDetectedTransaction()"]
    R --> S["Ledger updated automatically in background"]
    Q -- No --> T["Store adds to state.detectedTransactions (status: DETECTED)"]
    T --> U["Dashboard displays PendingDetectedTransactionsBanner"]
    U --> V["User taps 'Review' -> Opens ReviewDetectedTransactionModal"]
    V --> W{"User Action"}
    W -- Tap 'Confirm Payment' --> X["useAppStore.confirmDetectedTransaction() -> Ledger debited"]
    W -- Tap 'Dismiss / Reject' --> Y["useAppStore.rejectDetectedTransaction() -> Status marked REJECTED"]
```

### Detailed Trace:
1. **Starting Point**: User completes a ₹120 tea/snacks payment via PhonePe.
2. **Background Trigger**: Android OS delivers a notification from `com.phonepe.app`.
3. **Native Service Execution**: [UPINotificationListenerService.kt](file:///D:/Pocketwise/src/native/android/service/UPINotificationListenerService.kt) captures the notification extras.
4. **Parsing & Clean-up**:
   - `PhonePeParser.kt` extracts `amount = 120.0` and `merchant = "Chai Point"`.
   - `MerchantCategorizer.kt` recognizes keyword `"chai"` and assigns `suggestedCategory = "Food & Dining"`, `confidence = 0.88`.
5. **Deduplication Check**:
   - `DuplicateDetector.kt` computes SHA-256 hash. If received again within 5 minutes, it is dropped.
6. **Native Storage**: Saved to Android `SharedPreferences` (`pocketwise_upi_storage`).
7. **Bridge Emission**: Dispatched via `DeviceEventManagerModule` to React Native.
8. **UI Presentation**:
   - If auto-confirm is enabled and confidence $\ge 0.85$, the transaction is automatically added to the ledger.
   - Otherwise, `PendingDetectedTransactionsBanner` appears on the dashboard with a "Review" button.
9. **User Confirmation**: User inspects the details in [ReviewDetectedTransactionModal.tsx](file:///D:/Pocketwise/src/components/modals/ReviewDetectedTransactionModal.tsx) and taps "Confirm Payment".

---

## Workflow 3: Internal Account-to-Account Fund Transfer

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Modal as TransferModal
    participant Store as useAppStore
    participant Storage as StorageService
    participant UI as Accounts & Dashboard Screens

    User->>Modal: Select Source ("HDFC Bank") & Destination ("Paytm Wallet")
    User->>Modal: Enter Amount (₹2,000) & Tap "Confirm Transfer"
    Modal->>Modal: Validate fromAccountId !== toAccountId AND amount > 0
    Modal->>Store: transferBetweenAccounts(fromId, toId, 2000, notes)
    Note over Store: 1. Find fromAccount & toAccount<br/>2. Create Transaction (type: 'transfer')<br/>3. Debit source account: fromAcc.balance - 2000<br/>4. Credit dest account: toAcc.balance + 2000
    Store->>Storage: setItem(@pocketwise_transactions_v2, updatedTransactions)
    Store->>Storage: setItem(@pocketwise_accounts_v2, updatedAccounts)
    Store-->>Modal: return true
    Modal->>Modal: onClose()
    Store-->>UI: Re-render with new account balances
    UI-->>User: Source debited ₹2,000, Destination credited ₹2,000, Total Net Worth unchanged
```

### Detailed Trace:
1. **Starting Point**: User taps "Transfer" in [AccountsScreen.tsx](file:///D:/Pocketwise/src/screens/accounts/AccountsScreen.tsx) or [BalanceCard.tsx](file:///D:/Pocketwise/src/components/financial/BalanceCard.tsx).
2. **User Action**: Selects source account (`fromAccountId`), destination account (`toAccountId`), enters transfer amount (`₹2,000`), and optional notes.
3. **Frontend Validation**: [TransferModal.tsx](file:///D:/Pocketwise/src/components/modals/TransferModal.tsx#L60) verifies that the source and destination accounts are distinct and that amount is positive.
4. **Store Execution**: `useAppStore.transferBetweenAccounts()` calls `addTransaction()` with `type: 'transfer'`.
5. **Balance Update**:
   $$\text{fromAccount.balance} \leftarrow \text{fromAccount.balance} - 2000$$
   $$\text{toAccount.balance} \leftarrow \text{toAccount.balance} + 2000$$
6. **Net Liquid Impact**: Zero net balance change; total net worth remains balanced while individual liquidity pools update accurately.

---

## Workflow 4: Savings Goal Contribution & Fund Withdrawal

```mermaid
flowchart LR
    subgraph Deposit_Workflow ["Contribution Workflow (Deposit)"]
        D1["Tap 'Add Funds' on Goal Card"] --> D2["AddGoalFundsModal: Select Account & Amount"]
        D2 --> D3["useAppStore.contributeToGoal()"]
        D3 --> D4["addTransaction(type: 'saving')"]
        D4 --> D5["Account.balance -= Amount\nGoal.currentAmount += Amount"]
        D5 --> D6{"currentAmount >= targetAmount?"}
        D6 -- Yes --> D7["Set Goal.isCompleted = true\nTrigger Milestone Notification"]
        D6 -- No --> D8["Update Goal Progress %"]
    end

    subgraph Withdraw_Workflow ["Withdrawal Workflow"]
        W1["Tap 'Withdraw' on Goal Card"] --> W2["WithdrawGoalFundsModal: Select Account & Amount"]
        W2 --> W3["Validate Amount <= Goal.currentAmount"]
        W3 --> W4["useAppStore.withdrawFromGoal()"]
        W4 --> W5["Goal.currentAmount -= Amount\nAccount.balance += Amount"]
        W5 --> W6["Log Transaction(type: 'income', title: 'Withdrawal from...')"]
        W6 --> W7["Dashboard & Savings Vault balances updated"]
    end
```

---

## Workflow 5: Category Budget Warning & Threshold Evaluation

```mermaid
flowchart TD
    A["New Expense Transaction Recorded"] --> B["useAppStore updates transactions array"]
    B --> C["NotificationService.checkAndGenerateNotifications()"]
    C --> D["Iterate over budgets in state.budgets"]
    D --> E["FinancialCalculationsService.calculateBudgetPerformance(budget, transactions)"]
    E --> F["Sum all expenses for categoryId within budget date range"]
    F --> G["Compute percentageUsed = (spent / amount) * 100"]
    G --> H{"percentageUsed >= 100%?"}
    H -- Yes --> I["status = 'exceeded'\nEmit ⚠️ Budget Exceeded Notification"]
    H -- No --> J{"percentageUsed >= alertThreshold (80%)?"}
    J -- Yes --> K["status = 'warning'\nEmit 🔔 Budget Warning Notification"]
    J -- No --> L["status = 'normal'"]
    I & K --> M["Dashboard Bell Badge displays active alert count"]
    M --> N["BudgetsScreen renders colored warning/exceeded badge"]
```

---

## Workflow 6: Data Backup Export & JSON Restoration

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Profile as ProfileScreen
    participant Service as ExportImportService
    participant Store as useAppStore
    participant Storage as StorageService

    Note over User, Profile: EXPORT WORKFLOW
    User->>Profile: Tap "Export Data as JSON"
    Profile->>Profile: Compile AppExportData snapshot (accounts, tx, budgets, goals, recurring, settings)
    Profile->>Service: exportToJSON(data)
    Service-->>Profile: Formatted JSON string
    Profile-->>User: Open Export Modal with formatted text & "Copy to Clipboard"

    Note over User, Profile: IMPORT & RESTORATION WORKFLOW
    User->>Profile: Tap "Import Data Backup from JSON"
    User->>Profile: Paste JSON string & tap "Validate & Restore"
    Profile->>Service: validateAndParseImportJSON(jsonText)
    alt JSON is Invalid
        Service-->>Profile: { isValid: false, error: "Validation failure" }
        Profile-->>User: Show inline error message
    else JSON is Valid
        Service-->>Profile: { isValid: true, data: validData }
        Profile->>Store: importData(validData)
        Store->>Storage: Overwrite all STORAGE_KEYS in parallel
        Store->>Store: Recalculate overview & insights
        Store-->>Profile: return true
        Profile-->>User: Alert: "Import Success: Your financial data has been imported."
    end
```

