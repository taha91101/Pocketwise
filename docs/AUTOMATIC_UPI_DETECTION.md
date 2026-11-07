# Automatic UPI Expense Detection in PocketWise

PocketWise includes a production-ready, on-device automatic expense detection engine for Android UPI payments. This document details the architecture, supported applications, deduplication strategy, configuration guide, privacy model, and Google Play Store compliance.

---

## 1. Architecture Overview

Automatic detection operates via an Android native `NotificationListenerService` that intercepts payment success notifications from authorized payment applications directly on the user's device, parses and normalizes the transaction, deduplicates against existing records, and passes the transaction into the PocketWise financial engine.

```text
Android Payment Notification
          ↓
UPINotificationListenerService (Android Service)
          ↓
Supported Package Filter (com.google.android.apps.nbu.paisa.user, etc.)
          ↓
Noise & Failure Rejection (Filters out OTPs, Collects, Promotions, Failures)
          ↓
Notification Parser (App-specific or Generic Bank Parser)
          ↓
Merchant Categorization & Normalization (Maps to PocketWise categories)
          ↓
Duplicate Detection (UPI Ref / Hash tolerance window)
          ↓
Local Persistent Storage (SharedPreferences offline cache)
          ↓
React Native Bridge (UPITransactionDetectionModule / Event Emitter)
          ↓
PocketWise State Store (Zustand addTransaction)
          ↓
Dashboard, Spending Charts, Reports & Budgets Updated Instantly
```

---

## 2. Supported Applications & Package Identifiers

| App Name | Package Name | Primary Parsing Strategy |
| :--- | :--- | :--- |
| **Google Pay (Tez)** | `com.google.android.apps.nbu.paisa.user` | `GooglePayParser`: Regex extraction of payee, amount, UPI transaction ID |
| **PhonePe** | `com.phonepe.app` | `PhonePeParser`: Extraction of payee, amount, and UTR/Ref |
| **Paytm** | `net.one97.paytm` | `PaytmParser`: Paid to merchant, amount, Ref |
| **BHIM UPI** | `in.org.npci.upiapp` | `BHIMParser`: NPCI standard format extraction |
| **Amazon Pay** | `in.amazon.mShop.android.shopping`, `com.amazon.mShop.android.shopping` | `AmazonPayParser`: Order payments & UPI transfers |
| **CRED** | `com.dreamplug.androidapp` | `CredParser`: CRED UPI payment debit alerts |
| **HDFC Bank MobileBanking** | `com.snapwork.hdfc` | `GenericBankUPIParser`: HDFC UPI debit notifications |
| **SBI YONO / Yono Lite** | `com.sbi.lotusintouch`, `com.sbi.SBIFreedomPlus` | `GenericBankUPIParser`: SBI UPI debit alerts |
| **ICICI iMobile Pay** | `com.csam.icici.bank.imobile` | `GenericBankUPIParser`: ICICI debit alerts |
| **Axis Bank Mobile** | `com.axis.mobile` | `GenericBankUPIParser`: Axis UPI debit alerts |
| **Kotak Mobile Banking** | `com.kotak.mb` | `GenericBankUPIParser`: Kotak debit alerts |
| **Samsung Wallet / Pay** | `com.samsung.android.spay` | `GenericBankUPIParser`: Samsung Pay UPI debits |

---

## 3. Strict Noise and Failure Filtering

To avoid recording non-expense notifications, notifications matching any of the following patterns are discarded before parsing:

- **Failed & Pending Transactions**: "Failed", "Declined", "Cancelled", "Pending", "Processing payment"
- **Payment Requests & Collects**: "Payment request received", "Collect request", "requests money", "reminder to pay"
- **Promotions & Cashback**: "Cashback earned", "Won scratch card", "Flat off", "Discount", "Reward points"
- **Authentication & Security**: "OTP", "verification code", "one time password", "do not share"
- **Balance Inquiries**: "Available balance is" (without debit or credit event)

---

## 4. Duplicate Detection Engine

PocketWise implements a two-stage deduplication mechanism backed by persistent on-device storage:

1. **Primary Key (UPI Reference / UTR)**:
   If a 12-digit NPCI reference or transaction ID is extracted from the notification:
   $$\text{Key} = \text{SHA-256}(\text{packageName} + \text{":upi:"} + \text{upiReference})$$

2. **Fallback Key (Tolerance Window Bucket)**:
   If no explicit UPI reference is provided by the notification:
   $$\text{Key} = \text{SHA-256}(\text{packageName} + \text{":"} + \text{amountRounded} + \text{":"} + \text{normalizedMerchant} + \text{":"} + \text{timeBucket})$$
   where $\text{timeBucket} = \frac{\text{timestamp}}{5 \times 60 \times 1000}$ (5-minute tolerance window).

Keys are stored in a persistent LRU ring buffer in Android `SharedPreferences`. If an identical key is encountered within the cache window, it is dropped silently. This guarantees resilience across:
- Duplicate notifications posted by the payment app
- Service restarts
- Phone reboots
- Notification reposts or updates

---

## 5. Merchant Categorization System

Merchant names are cleaned and categorized into the standard PocketWise category hierarchy:

- **Food & Dining** (`cat-food`): Swiggy, Zomato, Starbucks, McDonald's, KFC, Dominos, Burger King, Chaayos, Cafe, Restaurant, Bakery, etc.
- **Groceries** (`cat-groceries`): Blinkit, Zepto, Instamart, BigBasket, DMart, Supermarket, Kirana, etc.
- **Transport** (`cat-transport`): Uber, Ola, Rapido, Namma Yatri, Fastag, Indian Oil, HPCL, Shell, Metro, etc.
- **Shopping** (`cat-shopping`): Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, Zara, H&M, Electronics, etc.
- **Bills & Utilities** (`cat-bills`): Airtel, Jio, VI, BESCOM, Adani Electricity, Tata Power, Water, Gas, etc.
- **Entertainment** (`cat-entertainment`): Netflix, Spotify, Disney+ Hotstar, BookMyShow, PVR, INOX, etc.
- **Health & Medical** (`cat-health`): Apollo, PharmEasy, Tata 1mg, MedPlus, Pharmacy, Hospital, Clinic, etc.
- **Travel** (`cat-travel`): IRCTC, MakeMyTrip, Cleartrip, Indigo, Air India, Hotels, etc.
- **Rent & Housing** (`cat-rent`): NoBroker, MyGate, Maintenance, Society, etc.
- **Other Expenses** (`cat-other-exp`): Fallback for unmatched merchants.

---

## 6. How to Add a New UPI App Parser

1. Create a class extending `NotificationParser` in `src/native/android/parser/YourAppParser.kt`:
   ```kotlin
   class YourAppParser : NotificationParser() {
       override val supportedPackages = setOf("com.example.yourapp")
       override val providerName = "Your App"

       override fun parse(packageName: String, title: String, text: String, timestamp: Long): DetectedTransaction? {
           if (isIgnorableNotification(title, text)) return null
           val amount = extractAmount(title) ?: extractAmount(text) ?: return null
           // Extract merchant & UPI Ref...
           return createDetectedTransaction(...)
       }
   }
   ```
2. Register the parser in `ParserRegistry.kt`:
   ```kotlin
   PaymentAppConfig(
       packageName = "com.example.yourapp",
       displayName = "Your App",
       parser = YourAppParser()
   )
   ```
3. Add the mirrored parser in `src/services/upiParser.ts` and add tests in `src/__tests__/upiDetection.test.ts`.

---

## 7. Privacy & Security

PocketWise adheres strictly to privacy-first principles:
1. **100% Local Processing**: All notification listening and regex extraction executes strictly on-device in native Android code.
2. **Zero Cloud Uploads**: Notification payloads and text are never transmitted over the network.
3. **No Sensitive Data Stored**: OTPs, PINs, card numbers, and bank account credentials are never stored.
4. **Sanitized Logs**: Production logs never contain raw notification text. Only sanitized entries (amount, cleaned merchant, provider) are emitted.

---

## 8. Google Play Store Compliance

When publishing to Google Play Store:
- **Permission**: The app utilizes `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`.
- **User Disclosure**: PocketWise provides clear, upfront disclosure before redirecting the user to Android Notification Access settings.
- **User Control**: Users can toggle automatic detection ON or OFF at any time in Settings.
- **Prominent Disclosure**: The Settings screen explicitly explains: *"PocketWise detects payment notifications from supported UPI and banking apps to automatically track expenses on your device."*
