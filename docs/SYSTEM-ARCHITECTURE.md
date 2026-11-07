# PocketWise — Complete System Architecture & Technical Diagrams

This document consolidates the complete system architecture, data flow pipelines, hardware bridges, and interaction diagrams for the PocketWise application.

---

## 1. Master System Architecture

PocketWise is engineered with a **Two-Tier Offline-First Client Architecture** comprising a cross-platform React Native presentation layer and an autonomous Android native background processing engine.

```mermaid
graph TB
    subgraph Client_Presentation ["Presentation Layer (React Native 0.86 / Expo SDK 57)"]
        UI_Screens["Screens\n(Dashboard, Ledger, Budgets, Savings, Profile, etc.)"]
        UI_Modals["Modal Overlays\n(AddTransaction, Transfer, ReviewDetected, etc.)"]
        Nav["React Navigation v7\n(RootNavigator & BottomTabNavigator)"]
        Theme["Theme & Design System\n(useTheme / colors / typography)"]
    end

    subgraph State_And_Logic ["State & Business Intelligence Layer"]
        Store["Zustand Global Store\n(useAppStore.ts)"]
        Calc["Financial Calculations Engine\n(FinancialCalculationsService.ts)"]
        Insights["AI Financial Insights Engine\n(InsightsService.ts)"]
        Notif["In-App Notification Engine\n(NotificationService.ts)"]
        Serial["Serialization & Backup Service\n(ExportImportService.ts)"]
    end

    subgraph Persistence_Layer ["Local Persistence Subsystem"]
        Async["@react-native-async-storage/async-storage\n(JSON Document Collections)"]
        AndroidPrefs["Android SharedPreferences\n('pocketwise_upi_storage' & 'pocketwise_dedup_cache')"]
    end

    subgraph Native_Android_Engine ["Android Native Background Subsystem (Kotlin)"]
        Listener["UPINotificationListenerService.kt\n(Android Service Daemon)"]
        Parsers["App-Specific Parsers\n(GPay, PhonePe, Paytm, BHIM, Banks)"]
        Dedup["DuplicateDetector.kt\n(SHA-256 LRU Cache)"]
        Cat["MerchantCategorizer.kt\n(Keyword & RegEx Database)"]
        Bridge["UPITransactionDetectionModule.kt\n(React Native Bridge)"]
    end

    UI_Screens & UI_Modals <--> Nav
    UI_Screens & UI_Modals <--> Store
    Theme --> UI_Screens & UI_Modals
    Store <--> Calc & Insights & Notif & Serial
    Store <--> Async
    Bridge <--> AndroidPrefs
    Bridge -- "RCTDeviceEventEmitter" --> Store
    Listener --> Parsers --> Cat --> Dedup --> AndroidPrefs
    Dedup --> Bridge
```

---

## 2. Real-Time Data Flow: End-to-End Transaction Cycle

The following diagram tracks how a transaction travels from user touch (or background notification) through atomic validation, balance updating, disk persistence, and visual recalculation.

```mermaid
flowchart TD
    Start(["Transaction Initiation"]) --> InputType{"Input Channel"}

    InputType -- Manual Entry --> Form["User fills AddTransactionModal"]
    Form --> Validate["Validate Amount > 0 & Title != ''"]
    Validate --> StoreAction["useAppStore.addTransaction()"]

    InputType -- Background Notification --> NativeCapture["UPINotificationListenerService intercepts alert"]
    NativeCapture --> ParseClean["Parse Amount, Payee & Deduplicate"]
    ParseClean --> BridgeEmit["Bridge emits 'UPI_TRANSACTION_DETECTED'"]
    BridgeEmit --> AutoOrReview{"Auto-Confirm >= 0.85?"}
    AutoOrReview -- Yes --> StoreAction
    AutoOrReview -- No --> PendingList["Add to state.detectedTransactions"]
    PendingList --> UserReview["User reviews & taps 'Confirm' in Modal"]
    UserReview --> StoreAction

    StoreAction --> BalanceReconcile["Atomic Balance Adjustment\nAccount.balance -= Amount"]
    BalanceReconcile --> GoalCheck{"Is type === 'saving'?"}
    GoalCheck -- Yes --> GoalUpdate["SavingsGoal.currentAmount += Amount\nCheck isCompleted"]
    GoalCheck -- No --> DiskSave
    GoalUpdate --> DiskSave["StorageService.setItem() in parallel\n(@pocketwise_transactions_v2 & @pocketwise_accounts_v2)"]

    DiskSave --> Recalc["FinancialCalculationsService.calculateOverview()\nInsightsService.generateInsights()"]
    Recalc --> Render["Zustand re-renders UI:\n- BalanceCard displays new net worth\n- BudgetsScreen advances progress bar\n- SpendingChart renders updated day totals"]
    Render --> Done(["Execution Finished"])
```

---

## 3. Android Native Notification Detection Subsystem

The diagram below details the internal execution pipeline of the Android native service running in the background.

```mermaid
flowchart TD
    subgraph Android_OS ["Android OS"]
        OS_Alert["Incoming Status Bar Notification"]
    end

    subgraph Service_Pipeline ["UPINotificationListenerService.kt"]
        DetectPref{"isDetectionEnabled?"}
        FilterNoise{"Noise / Security / Failure Check\n(Reject OTPs, Failures, Collects)"}
        Registry["ParserRegistry.findParser(packageName)"]
        ParseApp["Execute App Parser\n(Extract Amount, Payee, Ref)"]
        Categorize["MerchantCategorizer.categorize(merchant)"]
        HashCalc["DuplicateDetector.generateDeduplicationKey()"]
        IsDupe{"Duplicate Key in Cache?"}
        MarkCache["DuplicateDetector.markAsProcessed()"]
        SavePref["DetectedTransactionStorage.saveTransaction()"]
        NotifyBridge["UPITransactionDetectionModule.notifyTransactionDetected()"]
    end

    subgraph React_Native ["React Native Application"]
        EventEmitter["RCTDeviceEventEmitter\n('UPI_TRANSACTION_DETECTED')"]
        AppStore["useAppStore.processIncomingDetectedTransaction()"]
    end

    OS_Alert --> DetectPref
    DetectPref -- Disabled --> Drop1["Ignore"]
    DetectPref -- Enabled --> FilterNoise
    FilterNoise -- Noise / OTP --> Drop2["Discard without processing"]
    FilterNoise -- Valid Alert --> Registry
    Registry -- Unmatched Package --> Drop3["Ignore"]
    Registry -- Matched --> ParseApp
    ParseApp --> Categorize --> HashCalc --> IsDupe
    IsDupe -- Duplicate Found --> Drop4["Drop silently"]
    IsDupe -- Unique Transaction --> MarkCache
    MarkCache --> SavePref --> NotifyBridge --> EventEmitter --> AppStore
```

---

## 4. Derived Financial Calculations & State Architecture

```mermaid
graph LR
    subgraph Inputs ["State Entities (useAppStore)"]
        T["Transactions[]"]
        A["Accounts[]"]
        B["Budgets[]"]
        G["SavingsGoals[]"]
        R["RecurringPayments[]"]
        S["UserSettings"]
    end

    subgraph Engine ["Calculation Services"]
        FC["FinancialCalculationsService\n- calculateTotalIncome\n- calculateTotalExpenses\n- calculateSavingsRate\n- calculateGrowthPercentage\n- calculateBudgetPerformance\n- calculateGoalMetrics"]
        IS["InsightsService\n- Spending Differentials\n- Top Category Impacts\n- 20% Discretionary Trim\n- 50/30/20 Benchmark"]
        NS["NotificationService\n- Budget 80%/100% Alerts\n- Due Date Reminders\n- Goal Milestones"]
    end

    subgraph Outputs ["Derived Reactive State"]
        Over["state.overview\n(Available Balance, Growth %, Savings Rate)"]
        Ins["state.insights\n(Achievement, Warning, Tip cards)"]
        NotifList["Dashboard Notifications\n(Active bell badges & alert banners)"]
    end

    T & A & G --> FC --> Over
    T & A & B & G & S --> IS --> Ins
    B & T & R & G & S --> NS --> NotifList
```

---

## 5. Persistence Subsystem & Key Topology

```mermaid
flowchart TB
    subgraph StorageService_Wrapper ["StorageService.ts"]
        Get["StorageService.getItem<T>(key, default)"]
        Set["StorageService.setItem<T>(key, value)"]
        Clear["StorageService.clearAll()"]
    end

    subgraph Storage_Keys ["AsyncStorage Keys (@pocketwise_*_v2)"]
        K1["@pocketwise_transactions_v2 -> Transaction[]"]
        K2["@pocketwise_accounts_v2 -> Account[]"]
        K3["@pocketwise_budgets_v2 -> Budget[]"]
        K4["@pocketwise_savings_goals_v2 -> SavingsGoal[]"]
        K5["@pocketwise_recurring_v2 -> RecurringPayment[]"]
        K6["@pocketwise_categories_v2 -> Category[]"]
        K7["@pocketwise_settings_v2 -> UserSettings"]
        K8["@pocketwise_detected_transactions_v2 -> DetectedTransaction[]"]
    end

    subgraph Android_SharedPreferences ["Android SharedPreferences (Mode Private)"]
        SP1["pocketwise_upi_storage -> detected_transactions (200 JSON items)"]
        SP2["pocketwise_dedup_cache -> processed_keys (500 SHA-256 hashes)"]
    end

    Set --> K1 & K2 & K3 & K4 & K5 & K6 & K7 & K8
    Get --> K1 & K2 & K3 & K4 & K5 & K6 & K7 & K8
    Clear --> K1 & K2 & K3 & K4 & K5 & K6 & K7 & K8
```

