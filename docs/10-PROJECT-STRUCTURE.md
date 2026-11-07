# Phase 9: Project Structure & Code Architecture — PocketWise

This document provides a comprehensive map of the directory hierarchy, modular responsibilities, component taxonomy, and dependency vectors of the PocketWise codebase.

---

## 1. Directory Tree & Module Map

```
D:\Pocketwise\
├── assets/                               # Static app icons, splash screens, branding images
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── icon.png
│   └── splash.png
├── plugins/                              # Expo Config Plugins (Native Generation)
│   └── withUpiDetector.js                # Custom plugin injecting native Kotlin files & permissions
├── src/                                  # Primary Application Source Root
│   ├── components/                       # UI Component Library
│   │   ├── common/                       # Reusable Atomic UI Primitives (Buttons, Cards, Inputs)
│   │   │   ├── AppButton.tsx             # Theme-aware styled button with variants & loading state
│   │   │   ├── AppCard.tsx               # Base elevated card container with rounded corners
│   │   │   ├── AppHeader.tsx             # Standard top navigation bar with back action
│   │   │   ├── AppInput.tsx              # Form input field with icons, error labels, currency tags
│   │   │   ├── AppText.tsx               # Typography primitive supporting size variants & weights
│   │   │   ├── Badge.tsx                 # Status indicator pill (normal, warning, error, info)
│   │   │   ├── CategoryIcon.tsx          # Dynamic category icon renderer with colored circle backdrop
│   │   │   ├── ConfirmDialog.tsx         # Modal confirmation dialog for destructive actions
│   │   │   ├── EmptyState.tsx            # Illustrated empty view with call-to-action button
│   │   │   └── ProgressBar.tsx           # Animated percentage progress indicator
│   │   ├── financial/                    # Domain-Specific Financial Visual Widgets
│   │   │   ├── BalanceCard.tsx           # Master net liquid balance & savings rate card
│   │   │   ├── CategoryBreakdown.tsx     # Ranked category spend breakdown list with percentage bars
│   │   │   ├── FinancialInsightCard.tsx  # Dynamic recommendation card for AI insights
│   │   │   ├── MonthlyOverviewCard.tsx   # Income vs. Expense ratio comparison summary
│   │   │   ├── PendingDetectedTransactionsBanner.tsx # Urgent banner for unreviewed UPI payments
│   │   │   ├── QuickActions.tsx          # 4-button quick launcher (+ Expense, + Income, Saving, Transfer)
│   │   │   ├── SavingsGoalCard.tsx       # Progress card for wealth targets and monthly contribution
│   │   │   ├── SpendingChart.tsx         # 7-day bar chart visualization of recent daily expenditures
│   │   │   ├── TransactionItem.tsx       # Standard ledger list row component
│   │   │   └── UpcomingPaymentCard.tsx   # Subscription renewal reminder card with "Pay Now" action
│   │   └── modals/                       # Full-Screen & Bottom Sheet Form Overlays
│   │       ├── AddBudgetModal.tsx        # Modal for setting category spend limits
│   │       ├── AddGoalFundsModal.tsx     # Modal for depositing funds into a savings goal
│   │       ├── AddGoalModal.tsx          # Modal for creating a new savings goal
│   │       ├── AddRecurringModal.tsx     # Modal for scheduling recurring bills & subscriptions
│   │       ├── AddTransactionModal.tsx   # Modal for logging Expenses, Income, and Savings
│   │       ├── ReviewDetectedTransactionModal.tsx # Inspection & confirmation modal for detected UPI payments
│   │       ├── TransferModal.tsx         # Modal for transferring money between accounts
│   │       ├── WalkthroughModal.tsx      # 9-step interactive guided app walkthrough
│   │       └── WithdrawGoalFundsModal.tsx# Modal for withdrawing accumulated goal funds
│   ├── constants/                        # Global Static Definitions & Defaults
│   │   ├── categories.ts                 # Standard category dictionary (Food, Transport, Salary, etc.)
│   │   ├── initialData.ts                # Initial state models & demo data configurations
│   │   └── paymentMethods.ts             # Supported payment methods & currency definitions
│   ├── hooks/                            # Custom React Hooks
│   │   └── useTheme.ts                   # Theme hook exposing colors, spacing, radius, and dark mode flag
│   ├── native/                           # Android Native Kotlin Source Code
│   │   └── android/
│   │       ├── categorizer/
│   │       │   └── MerchantCategorizer.kt# Keyword & direct merchant category matching engine
│   │       ├── dedup/
│   │       │   └── DuplicateDetector.kt  # SHA-256 LRU deduplication ring buffer
│   │       ├── model/
│   │       │   └── DetectedTransaction.kt# Kotlin data class for detected transactions
│   │       ├── module/
│   │       │   ├── UPITransactionDetectionModule.kt # React Native Bridge Java/Kotlin module
│   │       │   └── UPITransactionDetectionPackage.kt# ReactPackage registration class
│   │       ├── parser/                   # App-Specific Notification Parsers
│   │       │   ├── AmazonPayParser.kt
│   │       │   ├── BHIMParser.kt
│   │       │   ├── CredParser.kt
│   │       │   ├── GenericBankUPIParser.kt
│   │       │   ├── GooglePayParser.kt
│   │       │   ├── NotificationParser.kt
│   │       │   ├── ParserRegistry.kt
│   │       │   ├── PaytmParser.kt
│   │       │   └── PhonePeParser.kt
│   │       ├── service/
│   │       │   └── UPINotificationListenerService.kt # Android NotificationListenerService implementation
│   │       └── storage/
│   │           └── DetectedTransactionStorage.kt    # SharedPreferences persistent cache
│   ├── navigation/                       # Navigation Configuration
│   │   ├── BottomTabNavigator.tsx        # 5-tab persistent bottom navigation bar
│   │   └── RootNavigator.tsx             # Root native stack router with onboarding gates
│   ├── screens/                          # Application Screen Views
│   │   ├── accounts/
│   │   │   └── AccountsScreen.tsx        # Liquidity accounts manager & transfer hub
│   │   ├── budgets/
│   │   │   └── BudgetsScreen.tsx         # Category budgets & overspending alert screen
│   │   ├── calendar/
│   │   │   └── CalendarScreen.tsx        # Financial calendar grid & daily transaction audit
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx       # Executive financial summary dashboard
│   │   ├── onboarding/
│   │   │   └── OnboardingScreen.tsx      # Welcome slides, personalization & setup form
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx         # Settings, theme, currency, notifications, backup & export
│   │   ├── recurring/
│   │   │   └── RecurringScreen.tsx       # Subscriptions & recurring bill management
│   │   ├── reports/
│   │   │   └── ReportsScreen.tsx         # Time-series analytics & cash flow statements
│   │   ├── savings/
│   │   │   └── SavingsScreen.tsx         # Savings goals & wealth vaults
│   │   ├── settings/
│   │   │   └── AutomaticDetectionSettingsScreen.tsx # UPI auto-detection diagnosis & configuration
│   │   └── transactions/
│   │       ├── TransactionDetailScreen.tsx # Detailed view of individual transaction records
│   │       └── TransactionsScreen.tsx    # Searchable, filterable transaction ledger
│   ├── services/                         # Business Logic & Infrastructure Services
│   │   ├── exportImportService.ts        # JSON and CSV data backup and restoration engine
│   │   ├── financialCalculations.ts      # Core mathematical calculations (overviews, budgets, goals)
│   │   ├── insightsService.ts            # Rule-based AI financial insights generator
│   │   ├── notificationService.ts        # In-app notification evaluation engine
│   │   ├── upiDetectionService.ts        # JavaScript bridge wrapper for native Android module
│   │   └── upiParser.ts                  # Pure JS mirror parser for simulation & web fallbacks
│   ├── storage/                          # Persistence Abstractions
│   │   ├── keys.ts                       # Versioned storage key constants (@pocketwise_*_v2)
│   │   └── storageService.ts             # Typed AsyncStorage wrapper with error handling
│   ├── store/                            # Global State Management
│   │   └── useAppStore.ts                # Root Zustand store managing data, actions, and calculations
│   ├── theme/                            # Design System Tokens
│   │   ├── colors.ts                     # Light and dark color palettes
│   │   ├── index.ts                      # Consolidated theme token exports
│   │   ├── radius.ts                     # Border radius scales (sm, md, lg, xl, xxl, full)
│   │   ├── shadows.ts                    # Elevation and shadow tokens
│   │   ├── spacing.ts                    # Spacing grid (xs, sm, md, lg, xl, xxl)
│   │   └── typography.ts                 # Font sizes, line heights, font weights
│   ├── types/                            # TypeScript Type Definitions
│   │   └── index.ts                      # Core interfaces: Transaction, Account, Budget, Goal, etc.
│   └── __tests__/                        # Automated Test Suites
│       ├── financialCalculations.test.ts # Mathematical unit test suite (16 tests)
│       └── upiDetection.test.ts          # UPI parsing and deduplication test suite (10 tests)
├── App.tsx                               # Application root component (hydration & providers)
├── app.json                              # Expo application manifest & plugin configuration
├── eas.json                              # EAS Cloud build configurations
├── index.ts                              # Expo root component registration entry point
├── jest.config.js                        # Jest test runner configuration
├── package.json                          # NPM dependencies, scripts, and engine specifications
└── tsconfig.json                         # TypeScript compiler configuration
```

---

## 2. Layered Architectural Responsibilities

PocketWise follows a clean **Separation of Concerns (SoC)** architectural pattern:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (Screens & Modals)                   │
│    - Renders user interfaces and collects form inputs       │
│    - Dispatches actions to Zustand store                   │
│    - Subscribes to reactive store slices                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. STATE & ORCHESTRATION LAYER (Zustand useAppStore)        │
│    - Maintains single source of truth in memory             │
│    - Enforces balance reconciliation rules                  │
│    - Coordinates persistence across storage keys            │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. DOMAIN LOGIC SERVICES LAYER (Pure Calculation Engines)   │
│    - FinancialCalculationsService (Mathematical aggregations)│
│    - InsightsService (Rule-based recommendation generation) │
│    - NotificationService (Alert threshold evaluation)       │
│    - ExportImportService (Serialization & validation)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 4. PERSISTENCE & HARDWARE LAYER                            │
│    - StorageService (@react-native-async-storage)           │
│    - UPINotificationListenerService (Android Native Daemon) │
│    - DetectedTransactionStorage (Android SharedPreferences) │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Component & Service Taxonomies

### 3.1 Shared Common Components (`src/components/common/`)
- **`AppButton`**: Supports variants (`primary`, `secondary`, `outline`, `danger`, `ghost`), sizes (`sm`, `md`, `lg`), disabled states, and animated loading spinners.
- **`AppInput`**: Handles numeric currency entry, search inputs, clear icons, multiline text areas, and error messages.
- **`AppCard`**: Base elevated container applying standard radius, borders, and shadows.
- **`AppText`**: Implements typography scale: `h1`, `h2`, `h3`, `body1`, `body2`, `caption`, `subtitle1`, `subtitle2`, `amount`, `amountSmall`.
- **`CategoryIcon`**: Resolves Feather icons and renders them inside a 40px rounded circle with corresponding category accent colors.
- **`ConfirmDialog`**: Standardized two-button modal dialog (`Cancel` vs `Confirm Action`) for destructive operations.

### 3.2 Services & Utilities (`src/services/`)
- **`FinancialCalculationsService`**: Pure, deterministic calculations. Zero side-effects. Easily unit-testable.
- **`InsightsService`**: Analyzes spending differentials, savings rates, and discretionary expense trims.
- **`NotificationService`**: Computes active notifications on-the-fly based on current metrics.
- **`ExportImportService`**: Handles JSON schema validation and RFC 4180 CSV serialization.
- **`UPIDetectionService`**: Encapsulates React Native NativeModules bridge invocations with safety fallbacks for iOS/Web.

