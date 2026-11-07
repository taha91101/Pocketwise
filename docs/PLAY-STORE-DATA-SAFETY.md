# PocketWise — Google Play Console Data Safety & Permission Disclosure Guide

This document provides exact responses and policy rationale for Google Play Console submission, specifically addressing Google's sensitive permissions policy for **Notification Listener Service (`BIND_NOTIFICATION_LISTENER_SERVICE`)** and the **Data Safety Questionnaire**.

---

## 1. Google Play Sensitive Permission Rationale

### Permission Requested: `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`
- **Core Functionality Declaration**:
  PocketWise is an on-device personal financial assistant. The Notification Listener Service is the primary, core feature of the application, designed to detect transaction confirmations from supported Indian UPI applications (e.g., Google Pay, PhonePe, Paytm, CRED, and major Indian banks) and automatically prompt the user to categorize their expense.
- **Prominent In-App Disclosure Requirement**:
  1. The app must present a full-screen or modal disclosure *before* redirecting the user to `Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`.
  2. The disclosure states that only payment confirmations are parsed, no personal messages or OTPs are stored, and no data leaves the phone.
- **Policy Compliance Checklist**:
  - [x] No cloud transfer: Notification snippets are parsed purely in local memory (`UPINotificationListenerService.kt`).
  - [x] OTP & Sensitive Filter: All notifications containing `OTP`, `code`, `verification`, or non-financial keywords are immediately dropped.
  - [x] Data Minimization: Only amount, merchant name, and timestamp are extracted into the local SQLite/AsyncStorage ledger.
  - [x] No advertising or monetization: Captured data is never sold, shared, or used for targeted ads.

---

## 2. Google Play Data Safety Questionnaire Responses

When completing the **Data safety** section in the Google Play Console:

### Overview
- **Does your app collect or share any of the required user data types?**
  **No** (All financial data and notifications remain 100% on-device).

If Google Play requires disclosing on-device processing:
- **Data Type: Financial info (Purchase history / Credit score / Other financial info)**:
  - Collected? **Yes** (Locally on device for app functionality).
  - Shared? **No** (Never transmitted to third parties or remote servers).
  - Processed ephemerally? **Yes** (Notifications are parsed in-memory; discarded immediately).
  - Is this data encrypted in transit? **N/A** (No network transit occurs).
  - Can users request that data be deleted? **Yes** (Users can reset all data or delete individual items in-app).

- **Data Type: Personal info (Name, Email)**:
  - Collected? **No**. PocketWise requires no registration, email, or account creation.

---

## 3. Privacy Policy Summary (In-App & Public URL)

> **Effective Date**: November 2026  
> **PocketWise** ("we", "our") is built on the principle of **Privacy by Architecture**. We do not operate remote servers for financial storage. Your finances are your own.
>
> 1. **Zero External Data Transmission**: All transaction records, account balances, budgets, debt liabilities, and receipts are stored locally on your device in encrypted SQLite/AsyncStorage databases.
> 2. **Notification Access**: PocketWise uses Android's Notification Access solely to recognize UPI and banking payment alerts. OTPs, passwords, and personal chats are strictly discarded and never logged.
> 3. **Encrypted Backups**: Backups exported by the user are protected using AES-GCM-256 with PBKDF2-SHA256 encryption.
> 4. **Revocability**: You can revoke notification access at any time through Android Settings > Apps > Special App Access > Device & app notifications.

