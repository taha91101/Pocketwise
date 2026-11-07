# Phase 14: Change & Dependency Map — PocketWise

This guide serves as an architectural impact map for developers, maintainers, and architects. It defines exactly what files, components, services, and tests are affected when modifying any layer of the PocketWise codebase.

---

## 1. Component & Module Impact Topology

```
Modification Propagation Chain
┌────────────────────────────────────────────────────────┐
│ Core Models & Types (src/types/index.ts)              │
└───────────┬────────────────────────────────────────────┘
            │ Impacts
            ▼
┌────────────────────────────────────────────────────────┐
│ Zustand Store & Persistence (src/store/useAppStore.ts) │
└───────────┬────────────────────────────────────────────┘
            │ Impacts
            ▼
┌────────────────────────────────────────────────────────┐
│ Domain Calculation Services (src/services/*)          │
└───────────┬────────────────────────────────────────────┘
            │ Impacts
            ▼
┌────────────────────────────────────────────────────────┐
│ Presentation & Navigation (src/screens/* & modals/*)   │
└───────────┬────────────────────────────────────────────┘
            │ Impacts
            ▼
┌────────────────────────────────────────────────────────┐
│ Automated Test Suites (src/__tests__/*)                │
└────────────────────────────────────────────────────────┘
```

---

## 2. Impact Matrix: "If You Modify X, You Must Update Y"

| Modified Component / Layer | Primary Files | Secondary Impacted Files | Required Actions & Tests |
| :--- | :--- | :--- | :--- |
| **`Transaction` Model** | `src/types/index.ts` | `src/store/useAppStore.ts`<br/>`src/services/financialCalculations.ts`<br/>`src/services/exportImportService.ts`<br/>`src/screens/transactions/*`<br/>`src/components/modals/AddTransactionModal.tsx` | - Update `AppExportData` in `exportImportService.ts`<br/>- Update CSV header columns in `exportTransactionsToCSV`<br/>- Run `npm test` to verify `financialCalculations.test.ts` |
| **`Account` Model & Types** | `src/types/index.ts`<br/>`src/constants/initialData.ts` | `src/store/useAppStore.ts`<br/>`src/screens/accounts/AccountsScreen.tsx`<br/>`src/screens/onboarding/OnboardingScreen.tsx`<br/>`src/components/financial/BalanceCard.tsx` | - Update type icons and color maps in `AccountsScreen` and `OnboardingScreen`<br/>- Verify balance calculation in `FinancialCalculationsService` |
| **`Category` Definitions** | `src/constants/categories.ts` | `src/native/android/categorizer/MerchantCategorizer.kt`<br/>`src/services/upiParser.ts`<br/>`src/components/modals/AddTransactionModal.tsx`<br/>`src/components/common/CategoryIcon.tsx` | - Keep Kotlin `MerchantCategorizer.kt` category IDs synchronized with TypeScript `DEFAULT_CATEGORIES`<br/>- Run `upiDetection.test.ts` |
| **`useAppStore` State Actions** | `src/store/useAppStore.ts` | All Screens in `src/screens/*`<br/>All Modals in `src/components/modals/*` | - Ensure atomic balance reconciliation logic is preserved<br/>- Verify all mutations call `StorageService.setItem` |
| **Financial Math Algorithms** | `src/services/financialCalculations.ts` | `src/store/useAppStore.ts`<br/>`src/services/insightsService.ts`<br/>`src/services/notificationService.ts`<br/>`src/__tests__/financialCalculations.test.ts` | - **MUST execute `npm test`**<br/>- Ensure edge cases (0 income, negative balances) do not produce `NaN` |
| **Android Native Parsers** | `src/native/android/parser/*`<br/>`src/native/android/service/*` | `plugins/withUpiDetector.js`<br/>`src/services/upiDetectionService.ts`<br/>`src/services/upiParser.ts`<br/>`src/__tests__/upiDetection.test.ts` | - Run `npx expo prebuild --clean` or rebuild development client<br/>- Verify Kotlin parser logic against simulated notification tests |
| **Theme Tokens (Colors / Spacing)**| `src/theme/colors.ts`<br/>`src/theme/spacing.ts` | `src/hooks/useTheme.ts`<br/>All UI components in `src/components/*` | - Verify both Light and Dark mode contrast ratios |
| **Navigation Routes** | `src/navigation/RootNavigator.tsx`<br/>`src/navigation/BottomTabNavigator.tsx` | `src/screens/dashboard/DashboardScreen.tsx`<br/>`src/screens/profile/ProfileScreen.tsx` | - Update navigation parameter types in screens using `navigation.navigate()` |

---

## 3. Developer Playbooks for Extending the Codebase

### Playbook A: Adding a New Payment Application Parser
To support a new payment app (e.g. "Jupiter Money" or "Fi Money"):
1. **Identify Package Name**: Find the Android package identifier (e.g. `money.jupiter`).
2. **Create Native Kotlin Parser**:
   - Create `JupiterParser.kt` in `src/native/android/parser/`.
   - Implement `NotificationParser` interface.
   - Extract amount via regex and extract payee/merchant.
3. **Register Parser in `ParserRegistry.kt`**:
   - Add `JupiterParser` to the list of active parsers in `ParserRegistry.kt`.
4. **Update Supported Apps Constants**:
   - Add the app to `DEFAULT_SUPPORTED_APPS` in `src/services/upiDetectionService.ts`.
5. **Update JavaScript Mirror**:
   - Add matching regex logic in `src/services/upiParser.ts`.
6. **Add Unit Test**:
   - Add notification test cases in `src/__tests__/upiDetection.test.ts`.
   - Run `npm test` to verify extraction accuracy.

### Playbook B: Adding a New Account Type
To introduce a new account classification (e.g. `'crypto'` or `'loan'`):
1. **Update Types**:
   - In `src/types/index.ts`, add the type to `AccountType`:
     ```typescript
     export type AccountType = 'bank' | 'cash' | 'credit' | 'wallet' | 'investment' | 'crypto';
     ```
2. **Update UI Selectors & Icons**:
   - In `src/screens/accounts/AccountsScreen.tsx`, add an icon (e.g. `'cpu'`) and theme color to `typeIcons` and `typeColors`.
   - In `src/screens/onboarding/OnboardingScreen.tsx`, add the chip option to the account setup form.
3. **Verify Balance Impact**:
   - In `src/store/useAppStore.ts`, verify that `addTransaction` and `deleteTransaction` update the balance appropriately.

### Playbook C: Adding a New Global Screen
To add a new screen (e.g. `AnalyticsDeepDiveScreen`):
1. **Create Screen Component**:
   - Create `src/screens/analytics/AnalyticsDeepDiveScreen.tsx`.
2. **Register in `RootNavigator.tsx`**:
   - Import the screen and declare `<Stack.Screen name="AnalyticsDeepDive" component={AnalyticsDeepDiveScreen} />`.
3. **Add Navigation Trigger**:
   - Add a touchable button in `ReportsScreen.tsx` or `DashboardScreen.tsx` invoking `navigation.navigate('AnalyticsDeepDive')`.

