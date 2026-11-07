# PocketWise v1.x Roadmap — Product Requirements Document

**Product**: PocketWise (`com.taha_911.pocketwise`)  
**Baseline Version**: 1.0.0  
**Document Date**: 7 November 2026  
**Status**: Draft for review  

> [!NOTE]
> This PRD is derived from the PocketWise master context, [README.md](file:///d:/Pocketwise/docs/README.md), [FEATURE-TRACEABILITY-MATRIX.md](file:///d:/Pocketwise/docs/FEATURE-TRACEABILITY-MATRIX.md), and [DOCUMENTATION-COVERAGE-REPORT.md](file:///d:/Pocketwise/docs/DOCUMENTATION-COVERAGE-REPORT.md). Anything marked *(proposal)* is a recommendation and not something the codebase already contains.

---

## 1. Executive Summary

PocketWise 1.0.0 is a 100% offline-first, single-user personal finance app for Android (React Native 0.86, Expo SDK 57, React Navigation v7, Zustand, AsyncStorage). Its differentiator is a native Kotlin `NotificationListenerService` that captures UPI payment notifications from 12 supported apps, parses, categorizes, deduplicates and queues them for one-tap review, all on device with no cloud, no bank login and no SMS permission.

The core loop works: onboarding, dashboard, ledger, budgets, savings goals, recurring bills, calendar, reports, multi-account transfers, rule-based insights, JSON/CSV backup and theming. Three features are only partially built (PIN lock, receipt capture, custom categories), and several structural risks (plain AsyncStorage JSON, manual-only recurring posting, in-app-only reminders, thin test coverage) will limit growth.

**Strategy for the next releases**:
1. Finish and harden what already exists so 1.0 is trustworthy.
2. Deepen the automatic capture advantage.
3. Turn captured data into planning and insight.
4. Make data durable and portable without compromising the privacy promise.
5. Expand reach.

---

## 2. Goals, Non-Goals and Principles

### 2.1 Goals
- Close every gap in the 1.0 implementation audit.
- Reduce manual entry: target at least 70% of expense rows created via detection (confirmed or auto-confirmed) for active UPI users.
- Make the app safe to hold real financial history: lock, encrypted backup, scalable storage.
- Give users forward-looking guidance (forecasts, bill awareness), not just history.

### 2.2 Non-Goals (for v1.x)
- No mandatory account, login or cloud backend.
- No bank-credential aggregation, no SMS reading.
- No iOS UPI detection (the OS does not expose payment notifications to apps). iOS is a stretch item for manual-only usage.
- No investment portfolio tracking or tax filing.

### 2.3 Product Principles
1. **Privacy by architecture**: data stays on device unless the user explicitly exports or opts in.
2. **Zero-surprise money movement**: nothing changes a balance without being visible and reversible.
3. **Offline always works**.
4. **Automate the boring part, confirm the important part**.

---

## 3. Target Users and Jobs To Be Done

| Persona | Profile | Primary Job |
| :--- | :--- | :--- |
| **Priya, salaried professional** | 26, pays almost everything via GPay/PhonePe, 2 bank accounts, SIPs and rent | Know where the salary went without typing anything |
| **Rohan, student** | 20, tight monthly allowance, cash plus UPI | Stay within category limits and avoid month-end shortfall |
| **Meera, freelancer** | 32, irregular income, tax set-asides, many subscriptions | Smooth out irregular income and track bills and savings buckets |

---

## 4. Current State Summary (Baseline)

| Area | Status |
| :--- | :--- |
| **Complete Features** | Onboarding, walkthrough, dashboard, ledger and search, transaction detail and reversal, UPI detection, budgets, savings goals, recurring tracker, calendar, reports, accounts and transfers, insights, JSON/CSV backup, theme, currency switching |
| **Partial Features** | PIN lock (setting exists, no lock screen), receipt capture (field exists, no picker), custom categories (flag exists, no creation UI) |
| **Known Debt** | `translucent` prop on `StatusBar` in [App.tsx line 34](file:///d:/Pocketwise/App.tsx#L34) fails strict `tsc`; [AppHeader.tsx](file:///d:/Pocketwise/src/components/common/AppHeader.tsx) and [AppCard.tsx](file:///d:/Pocketwise/src/components/common/AppCard.tsx) are dead code; [AGENTS.md](file:///d:/Pocketwise/AGENTS.md) still references Expo Router |
| **Tests** | 26 passing across 2 suites (financial calculations, UPI parsing and dedup). No component, store-action or recurring-logic tests |
| **Storage** | 8 AsyncStorage keys holding unbounded JSON arrays; native cache capped at 200 detected items and 500 dedup hashes |

### Gaps Inferred from Documentation (to be verified in code)
- `pinCode` is a plain string inside `UserSettings` in `AsyncStorage`, so it is not protected by hashing or the Android Keystore.
- Reminders appear to be in-app only (`NotificationService`), so nothing alerts the user when the app is closed.
- Recurring payments require a manual "Pay Now" tap; nothing posts them automatically.
- Detected types are limited to expense and income (refund); there is no learning from user corrections.
- Documentation counts are inconsistent (README says 17 features, the coverage report says 19, and the Feature 12 numbering is reused). Fix when docs are next touched.

---

## 5. Roadmap Overview

| Phase | Theme | Indicative Duration | Release |
| :---: | :--- | :---: | :---: |
| **0** | Stabilize and close audit gaps | 1 to 2 weeks | **1.0.1** |
| **1** | Trust and core completeness | 4 to 5 weeks | **1.1** |
| **2** | Smarter automatic capture | 4 to 5 weeks | **1.2** |
| **3** | Planning and insight | 5 to 6 weeks | **1.3** |
| **4** | Durable data and optional backup | 5 to 6 weeks | **1.4** |
| **5** | Reach and polish | Ongoing | **1.5+** |

*Estimates assume one to two engineers and should be refined after Phase 0.*

---

## 6. Phase 0 — Stabilize and Close Audit Gaps (v1.0.1)

**Objective**: A clean, green baseline before new features.

| ID | Work Item | Acceptance Criteria |
| :---: | :--- | :--- |
| **P0-1** | Remove `translucent` from `<StatusBar>` in [App.tsx](file:///d:/Pocketwise/App.tsx) | `npm run typecheck` passes with zero errors |
| **P0-2** | Delete [AppHeader.tsx](file:///d:/Pocketwise/src/components/common/AppHeader.tsx) and [AppCard.tsx](file:///d:/Pocketwise/src/components/common/AppCard.tsx), or adopt them in screens | No unused components remain; build and tests pass |
| **P0-3** | Correct [AGENTS.md](file:///d:/Pocketwise/AGENTS.md) to React Navigation v7 | No Expo Router references remain |
| **P0-4** | Add store-action tests ([useAppStore.ts](file:///d:/Pocketwise/src/store/useAppStore.ts)) for transaction add, update, delete reversal, transfers, goal contribute and withdraw | Every balance-affecting action has at least one reversal test; at least 60 total tests |
| **P0-5** | Add recurring due-date and notification logic tests | Edge cases covered: month-end, leap day, inactive items |
| **P0-6** | Add typecheck and test steps to CI before EAS builds | Failing tests block production builds |
| **P0-7** | Reconcile feature counts across README, coverage report and traceability matrix | One canonical feature list |

> [!IMPORTANT]
> **Exit criteria**: `tsc --noEmit`, `npm test` and `expo-doctor` all green.

---

## 7. Phase 1 — Trust and Core Completeness (v1.1)

**Objective**: Finish the three partial features and fill the most obvious daily-use gaps.

### F1.1 App Lock (PIN and Biometric)
- **Problem**: The security toggle exists but protects nothing, which is a trust risk for a finance app.
- **User Story**: *As a user, I want the app to require a PIN or fingerprint so that someone with my unlocked phone cannot read my finances.*
- **Requirements**:
  - Lock screen mounted in [RootNavigator.tsx](file:///d:/Pocketwise/src/navigation/RootNavigator.tsx) ahead of `MainTabs` when `securityEnabled` is true.
  - Set, change and disable PIN flows (4 or 6 digits, enter twice, require current PIN to change).
  - Biometric unlock through the platform keystore with PIN fallback.
  - Lock on cold start and after a configurable background timeout (immediate, 1 min, 5 min).
  - Hide content in the Android recents snapshot while locked.
  - Throttle failed attempts (5 failures then escalating delay).
  - Store only a salted hash, in secure storage, never the raw `pinCode`. Migrate any existing value on first run.
  - Forgot PIN: only path is reset after confirmation, which wipes local data (unless an encrypted backup exists, see F4.1).
- **Acceptance**: With lock on, no financial data is visible before authentication; the raw PIN is not recoverable from storage; deep links and notification taps also hit the lock.

### F1.2 Receipt and Attachment Capture
- **User Story**: *As a user, I want to attach a photo of a bill to a transaction so I can find proof later.*
- **Requirements**:
  - Camera and gallery picker in [AddTransactionModal.tsx](file:///d:/Pocketwise/src/components/modals/AddTransactionModal.tsx) and editable in [TransactionDetailScreen.tsx](file:///d:/Pocketwise/src/screens/transactions/TransactionDetailScreen.tsx).
  - Copy images into app-private storage (not a gallery URI that can disappear), compress to a sensible size.
  - Thumbnail in the ledger row, full-screen viewer in detail, delete attachment.
  - Included in backup (see F4.1); excluded from CSV, with a note in the export dialog.
  - Request camera or media permission only when the user taps attach.

### F1.3 Custom Categories
- **Requirements**:
  - Create, rename, recolor and re-icon categories (expense and income), set via Profile and also inline from the transaction modal.
  - Deleting a category with history requires re-assigning those transactions and budgets to another category.
  - Custom categories appear in budgets, reports, filters and exports and survive backup and restore.
  - Allow user keyword rules so detected merchants map to custom categories (feeds F2.2).

### F1.4 Edit Transaction
- **Requirements**:
  - Full edit from the detail screen (amount, date, account, category, notes) using the existing two-phase balance rollback. `updateTransaction` exists in the store, so this is primarily UI and validation.
- **Acceptance**: Editing across accounts leaves both balances correct, and goal-linked savings stay consistent.

### F1.5 System Notifications for Reminders
- **Requirements**:
  - Local scheduled notifications for upcoming recurring bills, budget thresholds and goal milestones, controlled by existing `NotificationSettings` toggles.
  - Reschedule on hydrate, on edit and after reboot. Respect the Android 13 and later notification permission.
  - Privacy: notification text avoids revealing amounts on the lock screen by default (setting).

### F1.6 Recurring Auto-Post *(proposal)*
- **Requirements**:
  - Per-item option "Auto-record on due date", creating the ledger transaction and debiting the account, with a catch-up for missed days when the app was closed.
  - Show an undo toast and mark the row `source: recurring`.
  - Guard against double-posting if a detected UPI payment already matches the bill (links to F2.3).

### F1.7 Better Search and Filters
- **Requirements**:
  - Date-range, amount-range, account and payment-provider filters; saved filter chips; sort options.

> [!IMPORTANT]
> **Phase 1 Exit Criteria**: No feature in the traceability matrix is marked Partially Implemented; lock, receipts and categories covered by tests.

---

## 8. Phase 2 — Smarter Automatic Capture (v1.2)

**Objective**: Extend the main differentiator so the ledger fills itself with fewer corrections.

### F2.1 Detection Reliability and Coverage
- Parser fixtures for every supported app and notification variant (success, pending, failed, refund, cashback, autopay, collect request).
- Remote-free parser versioning: ship parser updates through app releases, with a documented fixture-adding process.
- Additional apps *(proposal)*: Navi, Slice, MobiKwik, Freecharge, Jupiter, Fi, and common bank apps such as IDFC and Yes Bank.
- In-app diagnostics screen: last notification received, last parse result, and why a notification was dropped (OTP, failure, duplicate), with no raw content stored beyond the existing snippets.
- Expand the OEM battery and autostart guide with per-brand deep links (Xiaomi, Oppo, Vivo, Samsung, OnePlus, Realme).

### F2.2 Learn From Corrections
- When a user changes a detected category, store a local merchant-to-category rule; apply it first in `MerchantCategorizer` before keyword matching.
- Manage and view learned rules in settings; allow delete.
- **Success Metric**: Category-edit rate on detected items drops by at least 30% after two weeks of use.

### F2.3 Match Detected Payments to Existing Records
- Suggest linking a detected payment to a due recurring bill, a manually logged duplicate, or a goal contribution rather than creating a second row.
- Show a match banner in the review modal with Link or Create new.

### F2.4 Account Mapping and Balance Awareness
- Map payment source (for example, HDFC Bank notification) to a PocketWise account so detected items debit the correct account by default.
- Where notifications include an available balance, offer an optional Balance mismatch hint rather than silently changing balances.

### F2.5 Richer Detected Types
- Handle incoming credits (salary, peer receipts), ATM withdrawals as transfers to Cash, and EMI or autopay debits.
- Add a batch review: select many pending items and confirm, reject or recategorize together.

### F2.6 Split Transactions
- Split one payment across multiple categories (for example, a grocery bill that includes household items), keeping a single account debit.

> [!IMPORTANT]
> **Phase 2 Exit Criteria**: Fixture suite for all parsers in CI; detection diagnostics shipped; correction learning live.

---

## 9. Phase 3 — Planning and Insight (v1.3)

**Objective**: Move from what happened to what will happen.

### F3.1 Cash-Flow Forecast
- Project end-of-month balance from current balances, upcoming recurring items, average daily discretionary spend and expected income.
- Show a safe-to-spend today number on the dashboard and a low-balance warning.

### F3.2 Budget Upgrades
- Rollover of unspent balance (opt-in per budget), weekly and custom period polish, and an overall monthly cap.
- Zero-based budgeting view: assign every rupee of expected income.
- Budget suggestions from the last three months of spend.

### F3.3 Recurring Intelligence
- Auto-detect likely subscriptions from repeated merchants and amounts and offer to add them.
- Flag price increases, duplicate subscriptions and unused-looking subscriptions.
- Yearly cost rollup per subscription.

### F3.4 Smarter Insights
- Expand the rule-based [insightsService.ts](file:///d:/Pocketwise/src/services/insightsService.ts): month-over-month category spikes, no-spend streaks, goal-pace alerts, unusual-transaction flags.
- Keep all insights local and rule-based; each insight links to the filtered transactions behind it.

### F3.5 Net Worth and Debt
- Liabilities (credit cards, loans, EMIs) with payoff dates, a net worth trend line and a Debt vs Savings view.
- Credit card cycle awareness (statement date, due date, utilization).

### F3.6 Shared Expenses *(proposal)*
- Mark a transaction as split with friends, track who owes what, record settlements.
- Local only, with a shareable summary image or text.

### F3.7 Reports and Sharing
- Custom date ranges, month-versus-month comparison, tag support, and PDF or image export of a monthly report.
- Android home screen widget showing safe-to-spend and quick-add.

> [!IMPORTANT]
> **Phase 3 Exit Criteria**: Forecast accuracy within 10% of actual month-end balance for users with at least two months of data (measured locally in QA fixtures).

---

## 10. Phase 4 — Durable Data and Optional Backup (v1.4)

**Objective**: Make data safe to keep for years without breaking the privacy promise.

### F4.1 Encrypted Backup
- Password-protected, encrypted export (JSON plus attachments in one archive), with verified restore and schema versioning.
- Scheduled local backup reminders; one-tap share to Google Drive, email or files through the Android share sheet.
- Backward-compatible import of existing v2 JSON backups.

### F4.2 Storage Migration to SQLite
- Move transactions and detected items from single-array AsyncStorage JSON to SQLite (for example, `expo-sqlite`) with indexed date, account and category columns.
- One-time, resumable, transactional migration with automatic pre-migration backup and rollback on failure. Keep the `_v2` keys until the migration is confirmed.
- Target: ledger open under 300 ms with 50,000 transactions on a mid-range device; no full-array rewrites per action.

### F4.3 Optional End-to-End Encrypted Sync *(proposal, opt-in)*
- Only after F4.1 and F4.2. Client-side encryption so the server stores ciphertext only; conflict resolution by per-record timestamps.
- Requires a separate privacy review and must never be on by default. If it cannot meet the privacy principle, defer.

### F4.4 Data Integrity Tools
- Account reconciliation (compare real balance to app balance and create an adjustment entry), orphan detection after category deletes, and a repair routine for inconsistent goal or account totals.

> [!IMPORTANT]
> **Phase 4 Exit Criteria**: Zero data loss across migration test matrix (empty, demo, 10k and 50k rows, interrupted migration).

---

## 11. Phase 5 — Reach and Polish (v1.5+)

- **Localization**: Hindi first, then regional languages; locale-aware number grouping and date formats.
- **Accessibility**: Screen-reader labels, dynamic font scaling, color-independent budget status, minimum touch targets.
- **Multi-Currency**: Per-account currency with manual exchange rates.
- **Play Store Readiness**: Data-safety form, privacy policy explaining notification-access usage, listener-permission rationale screen, staged rollout.
- **Performance**: List virtualization audit, memoized selectors, startup under 2 s cold.
- **iOS *(stretch)***: Manual-only build sharing the codebase, with Detection hidden.

---

## 12. Next-Up Priority List

If only five things get built next, in this order:
1. **Phase 0 fixes and store tests** (small, unblocks everything and protects balance logic).
2. **App Lock (F1.1)**: highest trust gap, and the only partial feature with a security implication.
3. **Edit transaction UI (F1.4) plus custom categories (F1.3)**: the most visible daily frustrations.
4. **System reminder notifications (F1.5) and recurring auto-post (F1.6)**: turns the app from a log into an assistant.
5. **Learn from corrections (F2.2)**: biggest lift to the signature detection feature.

---

## 13. Non-Functional Requirements

| Area | Requirement |
| :--- | :--- |
| **Privacy** | No network calls by default; no analytics SDKs; notification content never leaves the device; OTP and verification messages are dropped before parsing (retain existing filter list and test it). |
| **Security** | PIN stored as salted hash; sensitive data excluded from screenshots and recents when locked; backups encrypted. |
| **Performance** | Cold start under 2 s; ledger scroll at 60 fps with 10k rows; detection to banner under 1 s. |
| **Reliability** | Every balance mutation is atomic and reversible; migrations are resumable; store hydration never crashes on corrupt storage (keep defensive try/catch). |
| **Compatibility** | Android 8 and later (target SDK 34 or 35); foreground survival across OEM battery policies documented. |
| **Quality** | Typecheck and tests are CI gates; parser fixtures required for each new supported app; target at least 80% coverage of `services/` and store balance actions. |
| **Accessibility** | WCAG AA contrast in both themes. |

---

## 14. Success Metrics

Because the app is offline and collects no telemetry, metrics come from opt-in, aggregate-only diagnostics or from user research and Play Store data.

| Metric | Target |
| :--- | :--- |
| **Share of expenses created by detection** | At least 70% for UPI-heavy users |
| **Detection category correction rate** | Down 30% after F2.2 |
| **Seven-day and thirty-day retention** | Establish baseline at 1.1, then improve by 10 points |
| **Users with lock enabled** | At least 40% |
| **Data-loss reports** | Zero |
| **Play Store rating** | At least 4.5 |
| **Crash-free sessions** | At least 99.5% |

---

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **OEM battery managers kill the listener** | Missed detections | Per-brand guides, diagnostics screen, a reconnect prompt when access is revoked. |
| **Notification formats change** | Parsers break | Fixture suite, fast patch releases, graceful fallback to generic bank parser. |
| **Google Play restrictions on notification access** | Rejection or removal | Clear in-app disclosure, privacy policy, minimal data retention, justify core-functionality use. |
| **Unbounded AsyncStorage JSON** | Slowdowns and corruption risk | Phase 4 SQLite migration; until then, monitor array sizes. |
| **Forgotten PIN means locked-out data** | Support burden | Encrypted backup first, clear warning at PIN setup. |
| **Migration bugs** | Data loss | Pre-migration backup, resumable steps, extensive fixtures. |
| **Scope creep into sync and cloud** | Violates privacy positioning | Gate behind opt-in and privacy review. |

---

## 16. Dependencies and Impacted Code

| Feature | Primary Code Touched |
| :--- | :--- |
| **App Lock** | [RootNavigator.tsx](file:///d:/Pocketwise/src/navigation/RootNavigator.tsx), [ProfileScreen.tsx](file:///d:/Pocketwise/src/screens/profile/ProfileScreen.tsx), `UserSettings` type, new secure-storage helper |
| **Receipts** | [AddTransactionModal.tsx](file:///d:/Pocketwise/src/components/modals/AddTransactionModal.tsx), [TransactionDetailScreen.tsx](file:///d:/Pocketwise/src/screens/transactions/TransactionDetailScreen.tsx), [exportImportService.ts](file:///d:/Pocketwise/src/services/exportImportService.ts) |
| **Custom Categories** | [categories.ts](file:///d:/Pocketwise/src/constants/categories.ts), [useAppStore.ts](file:///d:/Pocketwise/src/store/useAppStore.ts) (new category actions), `Add*Modal` category pickers, [exportImportService.ts](file:///d:/Pocketwise/src/services/exportImportService.ts) |
| **Local Notifications** | [notificationService.ts](file:///d:/Pocketwise/src/services/notificationService.ts), [useAppStore.ts](file:///d:/Pocketwise/src/store/useAppStore.ts), native permission handling |
| **Recurring Auto-Post** | [RecurringScreen.tsx](file:///d:/Pocketwise/src/screens/recurring/RecurringScreen.tsx), [notificationService.ts](file:///d:/Pocketwise/src/services/notificationService.ts), [useAppStore.ts](file:///d:/Pocketwise/src/store/useAppStore.ts) |
| **Detection Learning** | `MerchantCategorizer.kt`, `UPITransactionDetectionModule.kt`, [upiParser.ts](file:///d:/Pocketwise/src/utils/upiParser.ts) mirror |
| **SQLite Migration** | `storage/` layer, every store persistence call, [exportImportService.ts](file:///d:/Pocketwise/src/services/exportImportService.ts) |

> [!IMPORTANT]
> **Golden Rule**: Any change to a parser in Kotlin must be mirrored in [upiParser.ts](file:///d:/Pocketwise/src/utils/upiParser.ts) and covered by `upiDetection.test.ts` fixtures. Any new entity must be added to `AppExportData` and its validator.

---

## 17. Release and QA Plan

- Each phase ships as a numbered release through EAS to an internal Play track, then closed testing, then staged production rollout (10%, 50%, 100%).
- **Regression pack**: Balance reversal matrix, backup-restore round trip, parser fixtures, lock behavior, OEM-device detection checks on at least Xiaomi, Samsung and Pixel.
- Update the documentation suite (traceability matrix, coverage report, schema doc) as part of each phase's definition of done.

---

## 18. Open Questions

1. Is Play Store publication planned for 1.1, and is the notification-access policy review already prepared?
2. Is any optional sync acceptable to the product vision, or is local-only a permanent positioning statement?
3. Which regions beyond India matter, given detection is UPI-specific?
4. Should auto-confirm threshold (currently 0.85) be user-adjustable?
5. Is iOS a real target, given that detection is the headline feature?
6. Who owns parser maintenance as banks change notification text?

