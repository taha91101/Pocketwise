# Phase 3: Screen-by-Screen Documentation — PocketWise

This guide provides an exhaustive inventory and specification of every screen and modal overlay in the PocketWise application.

```
PocketWise Screen Architecture
├── Stack Navigator (RootNavigator)
│   ├── OnboardingScreen [Conditional: !hasCompletedOnboarding]
│   └── MainTabs (BottomTabNavigator) [Conditional: hasCompletedOnboarding]
│       ├── Tab 1: DashboardScreen ("Home")
│       ├── Tab 2: TransactionsScreen ("Transactions")
│       ├── Tab 3: BudgetsScreen ("Budgets")
│       ├── Tab 4: SavingsScreen ("Savings")
│       └── Tab 5: ProfileScreen ("Profile")
│   ├── TransactionDetailScreen
│   ├── ReportsScreen
│   ├── RecurringScreen
│   ├── CalendarScreen
│   ├── AccountsScreen
│   ├── AutomaticDetectionSettingsScreen
│   └── WalkthroughModal (Overlay)
```

---

## Screen 1: OnboardingScreen

- **Route Name**: `Onboarding`
- **File Path**: [src/screens/onboarding/OnboardingScreen.tsx](file:///D:/Pocketwise/src/screens/onboarding/OnboardingScreen.tsx)
- **Purpose**: Initial landing view for first-time users. Showcases key product capabilities and captures baseline personalization preferences and primary account setup.
- **Access Restrictions**: Rendered exclusively when `settings.hasCompletedOnboarding === false`.
- **Navigation Flow**:
  - Entry: Application launch when un-onboarded.
  - Exit: Upon completion of `handleFinish()`, navigates to `MainTabs` (`DashboardScreen`).

### Components Used
- `SafeAreaView`, `ScrollView`, `KeyboardAvoidingView`
- `AppText`, `AppButton`, `AppInput`, `Feather` icons

### User Actions Available
1. Tap "Next": Advances carousel slides (Slide 0 to 3).
2. Tap "Skip": Skips feature slides directly to Personalization form.
3. Form Inputs:
   - Name input field.
   - Currency selection chips (INR, USD, EUR, GBP, AED, CAD, AUD, SGD).
   - Income range selection chips.
   - Main savings goal selection chips.
   - Preferred savings target % chips (10%, 20%, 30%, 50%).
   - Account Name, Type selector (`bank`, `cash`, `credit`, `wallet`, `investment`), and Starting Balance.
4. Tap "Get Started": Commits settings and creates the initial account.

### Inputs & Validations
- `userName`: Trims whitespace; defaults to empty string if omitted.
- `currency`: Validated against `CURRENCY_OPTIONS`. Defaults to `'INR'`.
- `openingBalance`: Sanitized with `parseFloat(openingBalance.replace(/,/g, '')) || 0`.
- `accountName`: Defaults safely to `'Cash'` if blank.

### State & Data Displayed
- Slide carousel progress dots.
- Active currency symbols.
- Dynamic form states.

### Empty, Loading & Error States
- No loading indicator required; fully local state transitions.

---

## Screen 2: DashboardScreen

- **Route Name**: `Home` (under `MainTabs`)
- **File Path**: [src/screens/dashboard/DashboardScreen.tsx](file:///D:/Pocketwise/src/screens/dashboard/DashboardScreen.tsx)
- **Purpose**: Executive cockpit displaying real-time liquid balance, month-over-month growth, savings rates, quick action shortcuts, recent transactions, spending charts, and pending UPI payment alerts.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - Tapping Bell icon navigates to `ReportsScreen`.
  - Tapping "View All" on Recent Transactions switches tab to `TransactionsScreen`.
  - Tapping any transaction item navigates to `TransactionDetailScreen`.
  - Tapping "Review" on UPI banner opens `ReviewDetectedTransactionModal`.
  - Tapping "Transfer" opens `TransferModal`.
  - Tapping `+ Expense` / `+ Income` / `+ Saving` opens `AddTransactionModal`.

### Components Used
- `BalanceCard`, `QuickActions`, `MonthlyOverviewCard`, `SpendingChart`, `FinancialInsightCard`, `CategoryBreakdown`, `SavingsGoalCard`, `UpcomingPaymentCard`, `TransactionItem`, `PendingDetectedTransactionsBanner`, `AddTransactionModal`, `TransferModal`, `AddGoalFundsModal`, `WithdrawGoalFundsModal`.

### Data Displayed
- User greeting (`Good day, <Name> 👋`).
- Total Available Balance with multi-currency symbol.
- Month-over-month growth rate and savings rate percentage.
- Monthly Income vs. Expense ratio comparison bar.
- Last 7 days expenditure bar chart.
- Primary savings goal progress.
- Nearest upcoming bill due date and amount.
- Top expense category distribution.
- 5 most recent transactions.

### User Actions
- Pull-to-refresh to trigger state sync.
- Trigger modals for transactions, transfers, deposits, and withdrawals.

---

## Screen 3: TransactionsScreen

- **Route Name**: `Transactions` (under `MainTabs`)
- **File Path**: [src/screens/transactions/TransactionsScreen.tsx](file:///D:/Pocketwise/src/screens/transactions/TransactionsScreen.tsx)
- **Purpose**: Searchable, filterable ledger of all historical financial records across all accounts.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - Tapping `+` opens `AddTransactionModal`.
  - Tapping any item navigates to `TransactionDetailScreen` with `{ transactionId }`.

### Components Used
- `FlatList`, `AppInput`, `AppText`, `TransactionItem`, `PendingDetectedTransactionsBanner`, `EmptyState`, `AddTransactionModal`.

### User Actions & Filters
1. **Search**: Live text search matching transaction `title`, `categoryName`, `notes`, or `amount`.
2. **Type Segment**: Filters by `All`, `Expenses`, `Income`, `Savings`.
3. **Category Chips**: Horizontally scrollable category pills filtering by category ID.
4. **Clear Search**: Tapping the `'x'` icon in the search box clears the query.

### Empty & Error States
- If no records match filters, renders `EmptyState` with message *"No transactions found"* and a button to log a new transaction.

---

## Screen 4: TransactionDetailScreen

- **Route Name**: `TransactionDetail`
- **File Path**: [src/screens/transactions/TransactionDetailScreen.tsx](file:///D:/Pocketwise/src/screens/transactions/TransactionDetailScreen.tsx)
- **Purpose**: Deep inspection of an individual transaction, displaying full metadata, payment provider, receipt notes, UPI references, confidence scores, duplicate actions, and deletion controls.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - Entry: From `DashboardScreen`, `TransactionsScreen`, or `CalendarScreen`.
  - Exit: Back arrow navigates to previous screen. Deletion navigates back.

### Components Used
- `CategoryIcon`, `AppText`, `AppButton`, `ConfirmDialog`, `Feather` icons.

### Data Displayed
- Title and formatted currency amount (green for income, primary for savings, dark for expenses).
- Transaction Type badge (`Expense`, `Income`, `Savings Goal`, `Account Transfer`).
- Full timestamp (Weekday, Month, Day, Year, HH:MM).
- Category name with custom category icon and color circle.
- Account name and masked number.
- Destination account (for transfers) or Savings goal name (for savings).
- Payment method (`UPI`, `Bank Transfer`, etc.).
- Auto-detection confidence badge if `isAutomaticallyDetected === true`.
- Raw UPI reference / UTR number.
- Notes / memo text.

### User Actions
1. **Duplicate Transaction**: Clones transaction with current timestamp and returns.
2. **Delete Transaction**: Triggers `ConfirmDialog`. On confirmation, reverses balance impact and deletes record.

---

## Screen 5: BudgetsScreen

- **Route Name**: `Budgets` (under `MainTabs`)
- **File Path**: [src/screens/budgets/BudgetsScreen.tsx](file:///D:/Pocketwise/src/screens/budgets/BudgetsScreen.tsx)
- **Purpose**: Category-level expenditure governance and limit tracking.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - `+` button opens `AddBudgetModal`.

### Components Used
- `FlatList`, `ProgressBar`, `CategoryIcon`, `Badge`, `ConfirmDialog`, `EmptyState`, `AddBudgetModal`.

### Data Displayed
- **Master Summary Card**: Total monthly budget, total spent, remaining allowance, and overall percentage progress bar.
- **Budget Item Cards**: Category name, limit amount, spent amount, remaining amount, utilization bar, and status badge (`Normal`, `Warning` ≥80%, `Exceeded` ≥100%).

### User Actions
- Tap `+` to open budget creation modal.
- Tap Trash icon on any budget card to trigger deletion confirmation dialog.

### Empty State
- If `budgets.length === 0`, renders `EmptyState` explaining category limits with a "Create First Budget" button.

---

## Screen 6: SavingsScreen

- **Route Name**: `Savings` (under `MainTabs`)
- **File Path**: [src/screens/savings/SavingsScreen.tsx](file:///D:/Pocketwise/src/screens/savings/SavingsScreen.tsx)
- **Purpose**: Wealth vault and savings target manager calculating progress percentages and required monthly contributions.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - `+` button opens `AddGoalModal`.
  - "Add Funds" button on goal opens `AddGoalFundsModal`.
  - "Withdraw" button on goal opens `WithdrawGoalFundsModal`.

### Components Used
- `FlatList`, `SavingsGoalCard`, `FinancialInsightCard`, `EmptyState`, `AddGoalModal`, `AddGoalFundsModal`, `WithdrawGoalFundsModal`, `ConfirmDialog`.

### Data Displayed
- **Total Saved Showcase Card**: Total accumulated savings across all goals, aggregate target amount, and completion percentage.
- **Goal Cards**: Goal name, icon, target amount, current amount, target completion date, progress bar, required monthly contribution rate, and completion badge (`Goal Achieved 🎉`).
- **Smart Savings Recommendations**: Filtered list of AI insights proposing 20% trim suggestions on discretionary expenses.

### User Actions
- Add goal, contribute funds, withdraw funds, and delete goal.

---

## Screen 7: ProfileScreen

- **Route Name**: `Profile` (under `MainTabs`)
- **File Path**: [src/screens/profile/ProfileScreen.tsx](file:///D:/Pocketwise/src/screens/profile/ProfileScreen.tsx)
- **Purpose**: User profile management, global app preferences, notification toggles, local security, data backup exports, and reset operations.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - Navigates to `AccountsScreen`, `RecurringScreen`, `CalendarScreen`, `ReportsScreen`, or `AutomaticDetectionSettingsScreen`.

### Components Used
- `ScrollView`, `Switch`, `Modal`, `AppText`, `AppButton`, `AppInput`, `ConfirmDialog`.

### User Actions & Configuration Options
1. **Navigation Links**: Direct shortcuts to Accounts, Recurring, Calendar, Reports, and Automatic UPI Detection.
2. **Currency Modal**: Selects active currency from 8 world options.
3. **Dark Mode Switch**: Toggles `themeMode` (`light` vs `dark`).
4. **Granular Notification Switches**:
   - Budget Warnings
   - Recurring Payments
   - Savings Reminders
   - Monthly Summary
   - Goal Milestones
5. **Local App Security**: Toggles local passcode/PIN lock indicator.
6. **Data Management**:
   - "Export Data as JSON": Opens modal with formatted JSON backup.
   - "Export Transactions as CSV": Opens modal with CSV text.
   - "Import Data Backup from JSON": Opens modal with text input to paste and restore JSON.
   - "Reset All Data": Opens high-risk confirmation dialog to wipe all local data.
7. **Restart Product Walkthrough**: Resets `hasCompletedWalkthrough: false` and opens tour modal.

---

## Screen 8: AccountsScreen

- **Route Name**: `Accounts`
- **File Path**: [src/screens/accounts/AccountsScreen.tsx](file:///D:/Pocketwise/src/screens/accounts/AccountsScreen.tsx)
- **Purpose**: Liquid account manager supporting bank accounts, cash wallets, credit cards, and internal fund transfers.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - Tapping "Transfer" opens `TransferModal`.
  - Tapping `+` opens `AddAccountModal`.

### Data Displayed
- Aggregate Liquid Net Worth across all accounts.
- Account list with type badges, masked numbers, icons, and individual live balances.

---

## Screen 9: RecurringScreen

- **Route Name**: `Recurring`
- **File Path**: [src/screens/recurring/RecurringScreen.tsx](file:///D:/Pocketwise/src/screens/recurring/RecurringScreen.tsx)
- **Purpose**: Subscription and recurring bill tracker.
- **Access Restrictions**: All onboarded users.
- **Navigation Flow**:
  - Tapping `+` opens `AddRecurringModal`.

### User Actions
- Toggle active/inactive state of a subscription via Switch.
- Tap "Pay Now" on any bill card to immediately record an expense transaction in the ledger.
- Delete recurring commitment.

---

## Screen 10: CalendarScreen

- **Route Name**: `Calendar`
- **File Path**: [src/screens/calendar/CalendarScreen.tsx](file:///D:/Pocketwise/src/screens/calendar/CalendarScreen.tsx)
- **Purpose**: Monthly calendar grid visualizing daily transaction activity and allowing day-by-day cash flow audits.
- **Access Restrictions**: All onboarded users.

### User Actions
- Cycle months backward and forward.
- Tap any calendar day cell to view daily income/expense sums and transaction list for that date.

---

## Screen 11: ReportsScreen

- **Route Name**: `Reports`
- **File Path**: [src/screens/reports/ReportsScreen.tsx](file:///D:/Pocketwise/src/screens/reports/ReportsScreen.tsx)
- **Purpose**: Time-series cash flow analytics and category spending distributions.
- **Access Restrictions**: All onboarded users.

### User Actions
- Select period filter chip: `7 Days`, `30 Days`, `3 Months`, `6 Months`, `1 Year`.
- Inspect total income, expenses, savings allocated, net cash flow, and ranked category expense bars.

---

## Screen 12: AutomaticDetectionSettingsScreen

- **Route Name**: `AutomaticDetectionSettings`
- **File Path**: [src/screens/settings/AutomaticDetectionSettingsScreen.tsx](file:///D:/Pocketwise/src/screens/settings/AutomaticDetectionSettingsScreen.tsx)
- **Purpose**: Configuration and diagnosis center for the Android native automatic UPI expense detection engine.
- **Access Restrictions**: All onboarded users (Android native service integration).

### Data Displayed & Controls
1. **Permission Status Banner**: Shows whether Android Notification Access (`BIND_NOTIFICATION_LISTENER_SERVICE`) is Granted or Missing.
2. **"Enable Access in Settings" button**: Directs user to Android System Notification Listener settings.
3. **Master Detection Toggle**: Enables/disables background parsing.
4. **Auto-Confirm High Confidence Toggle**: Automatically commits detections with confidence ≥85%.
5. **Detect Refunds Toggle**: Controls whether refund credits are logged as income.
6. **Detect Bank Notifications Toggle**: Controls debit notification parsing from bank apps.
7. **Supported Apps List**: Status of Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay, and banks.
8. **Test Simulation Engine**: Button allowing users to simulate an incoming payment notification to verify end-to-end detection without spending real money.
9. **OEM Battery Optimization Guide**: Instructions for Xiaomi (MIUI), Samsung (OneUI), OnePlus (OxygenOS), and Vivo/Oppo devices to prevent OS battery savers from killing the background service.

---

## Inventory of Modal Overlays

| Modal Component | File Path | Trigger / Entry Point | Purpose |
| :--- | :--- | :--- | :--- |
| **`AddTransactionModal`** | `src/components/modals/AddTransactionModal.tsx` | Dashboard `+` or Ledger `+` | Logs an Expense, Income, or Saving transaction |
| **`TransferModal`** | `src/components/modals/TransferModal.tsx` | Dashboard "Transfer" or Accounts screen | Executes internal transfer between two accounts |
| **`AddBudgetModal`** | `src/components/modals/AddBudgetModal.tsx` | Budgets screen `+` | Sets category spend limit and 80% threshold |
| **`AddGoalModal`** | `src/components/modals/AddGoalModal.tsx` | Savings screen `+` | Creates a new savings goal target |
| **`AddGoalFundsModal`** | `src/components/modals/AddGoalFundsModal.tsx` | Goal card "Add Funds" | Allocates funds from an account to a goal |
| **`WithdrawGoalFundsModal`** | `src/components/modals/WithdrawGoalFundsModal.tsx` | Goal card "Withdraw" | Returns funds from a goal back to an account |
| **`AddRecurringModal`** | `src/components/modals/AddRecurringModal.tsx` | Recurring screen `+` | Creates recurring subscription/bill reminder |
| **`ReviewDetectedTransactionModal`** | `src/components/modals/ReviewDetectedTransactionModal.tsx` | Pending UPI Banner "Review" | Allows user to inspect, edit, confirm, or reject detected UPI payments |
| **`WalkthroughModal`** | `src/components/modals/WalkthroughModal.tsx` | RootNavigator or Profile "Restart Tour" | 9-step interactive guided app walkthrough |
| **`ConfirmDialog`** | `src/components/common/ConfirmDialog.tsx` | Delete buttons across all modules | Modal confirmation dialog for destructive actions |

