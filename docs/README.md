# PocketWise — Master Documentation Hub

Welcome to the comprehensive technical and operational documentation repository for **PocketWise** (`com.taha_911.pocketwise`, version 1.0.0).

This documentation suite provides complete end-to-end coverage of the application's architecture, business logic, screen inventory, database schema, native Android background detection engine, API interfaces, and deployment procedures.

---

## 🤖 All-In-One AI Context Document

If you are uploading documentation to an **AI Coding Assistant** (Claude, ChatGPT, Cursor, Copilot, Gemini) to give it total project understanding in a single file:
👉 **[POCKETWISE-MASTER-CONTEXT.md](file:///D:/Pocketwise/docs/POCKETWISE-MASTER-CONTEXT.md)**

---

## 📚 Complete Documentation Index

| Doc # | Document Title | Description | Primary Audience |
| :---: | :--- | :--- | :--- |
| **01** | [**Project Overview**](file:///D:/Pocketwise/docs/01-PROJECT-OVERVIEW.md) | Business objectives, problems solved, target audience, modules, high-level architecture diagram. | All Roles |
| **02** | [**Technology Stack**](file:///D:/Pocketwise/docs/02-TECHNOLOGY-STACK.md) | In-depth breakdown of React Native 0.86, Expo SDK 57, React Navigation v7, Kotlin native engine, Zustand, and dependencies. | Developers, Architects |
| **03** | [**Complete Feature Guide**](file:///D:/Pocketwise/docs/03-COMPLETE-FEATURE-GUIDE.md) | Exhaustive guide covering all 19 canonical features (16 complete, 3 partial): workflows, business logic, and edge cases. | PMs, Developers, QA |
| **04** | [**Screen-by-Screen Guide**](file:///D:/Pocketwise/docs/04-SCREEN-BY-SCREEN-GUIDE.md) | Inventory of all 12 screens and 10 modals: inputs, validation, data displayed, navigation flow, and states. | UI/UX, Developers, QA |
| **05** | [**User Roles & Permissions**](file:///D:/Pocketwise/docs/05-USER-ROLES-AND-PERMISSIONS.md) | Single-user client model, local onboarding, session lifecycle, role-permission matrix, and security audit. | Security, Architects |
| **06** | [**API & Native Interface Docs**](file:///D:/Pocketwise/docs/06-API-DOCUMENTATION.md) | Native Android Bridge API (`UPITransactionDetectionModule`), event emitters, and Zustand store action specifications. | Developers, Integrators |
| **07** | [**Database & Storage Schema**](file:///D:/Pocketwise/docs/07-DATABASE-SCHEMA.md) | Complete ER diagram (Mermaid), entity tables, fields, data types, keys, enums, cascade behavior, and keys. | Developers, DBAs |
| **08** | [**Business Logic & Workflows**](file:///D:/Pocketwise/docs/08-BUSINESS-WORKFLOWS.md) | Step-by-step sequence diagrams and flowcharts for expense logging, UPI detection, transfers, budgets, and goals. | PMs, QA, Developers |
| **09** | [**Third-Party Integrations**](file:///D:/Pocketwise/docs/09-THIRD-PARTY-INTEGRATIONS.md) | Android UPI apps (GPay, PhonePe, Paytm, BHIM, CRED, Banks), EAS Build cloud services, and privacy compliance. | Developers, DevOps |
| **10** | [**Project Structure & Architecture**](file:///D:/Pocketwise/docs/10-PROJECT-STRUCTURE.md) | Folder hierarchy, modular boundaries, shared component taxonomy, service layer, and design system tokens. | Developers, Tech Leads |
| **11** | [**Local Setup & Deployment Guide**](file:///D:/Pocketwise/docs/11-LOCAL-SETUP-AND-DEPLOYMENT.md) | Environment prerequisites (JDK 17, Android SDK), installation commands, test running, and EAS production builds. | DevOps, Developers |
| **12** | [**Security & Error Handling Audit**](file:///D:/Pocketwise/docs/12-SECURITY-AND-ERROR-HANDLING.md) | Threat model, OTP filtering, input sanitization, crash prevention, confirmed issues, and potential risks. | Security, Tech Leads |
| **13** | [**Implementation Audit & Tech Debt**](file:///D:/Pocketwise/docs/13-IMPLEMENTATION-AUDIT.md) | Full audit of complete vs. partial features, technical limitations, type issues, and remediation paths. | PMs, Tech Leads |
| **14** | [**Change & Dependency Map**](file:///D:/Pocketwise/docs/14-CHANGE-AND-DEPENDENCY-MAP.md) | "If you touch X, update Y" impact topology and developer playbooks for extending the application safely. | Developers, Maintainers |
| **15** | [**Product Requirements Document (PRD)**](file:///D:/Pocketwise/docs/15-PRODUCT-REQUIREMENTS-DOCUMENT.md) | Official v1.x roadmap, 6-phase release schedule, user personas, non-functional requirements, and priority lists. | PMs, Developers, Architects |
| **SYS**| [**System Architecture Diagrams**](file:///D:/Pocketwise/docs/SYSTEM-ARCHITECTURE.md) | Consolidated Mermaid diagrams: Master architecture, transaction data flows, Android listener, and storage. | Architects, Tech Leads |
| **F掛**| [**Feature Traceability Matrix**](file:///D:/Pocketwise/docs/FEATURE-TRACEABILITY-MATRIX.md) | End-to-end mapping from feature to screen, component, store action, service, database key, and test suite. | QA, PMs, Auditors |
| **COV**| [**Documentation Coverage Report**](file:///D:/Pocketwise/docs/DOCUMENTATION-COVERAGE-REPORT.md) | Verification audit metrics, feature/API counts, dead code discoveries, and accuracy checks. | Auditors, Tech Leads |
| **UPI**| [**Automatic UPI Detection Spec**](file:///D:/Pocketwise/docs/AUTOMATIC_UPI_DETECTION.md) | Pre-existing technical whitepaper detailing the Android UPI notification detection subsystem. | Android Developers |

---

## 🎯 Quick Navigation by Role

### 👨‍💻 For New Developers
1. Start with [Project Structure & Architecture](file:///D:/Pocketwise/docs/10-PROJECT-STRUCTURE.md) to understand where code lives.
2. Read [Local Setup & Deployment Guide](file:///D:/Pocketwise/docs/11-LOCAL-SETUP-AND-DEPLOYMENT.md) to boot Metro and run unit tests (`npm test`).
3. Consult [Change & Dependency Map](file:///D:/Pocketwise/docs/14-CHANGE-AND-DEPENDENCY-MAP.md) before writing code.

### 🧪 For QA Engineers & Testers
1. Read [Complete Feature Guide](file:///D:/Pocketwise/docs/03-COMPLETE-FEATURE-GUIDE.md) to understand expected business behavior.
2. Use [Screen-by-Screen Guide](file:///D:/Pocketwise/docs/04-SCREEN-BY-SCREEN-GUIDE.md) to inspect every validation rule and edge case.
3. Review [Feature Traceability Matrix](file:///D:/Pocketwise/docs/FEATURE-TRACEABILITY-MATRIX.md) to cross-check test suite coverage.

### 📋 For Technical Leads & Architects
1. Review [System Architecture Diagrams](file:///D:/Pocketwise/docs/SYSTEM-ARCHITECTURE.md) for master data flows.
2. Inspect [Database & Storage Schema](file:///D:/Pocketwise/docs/07-DATABASE-SCHEMA.md) for data consistency and cascade behavior.
3. Check [Implementation Audit & Tech Debt](file:///D:/Pocketwise/docs/13-IMPLEMENTATION-AUDIT.md) for known limitations and remediation priorities.

### 💼 For Product Managers & Business Analysts
1. Review [Project Overview](file:///D:/Pocketwise/docs/01-PROJECT-OVERVIEW.md) for target audience and problem statements.
2. Read [Business Logic & Workflows](file:///D:/Pocketwise/docs/08-BUSINESS-WORKFLOWS.md) for user journey sequence diagrams.
3. Check [Implementation Audit](file:///D:/Pocketwise/docs/13-IMPLEMENTATION-AUDIT.md) to see what is complete vs. partially implemented.
4. Read the [Product Requirements Document (PRD)](file:///D:/Pocketwise/docs/15-PRODUCT-REQUIREMENTS-DOCUMENT.md) for the v1.x multi-phase roadmap and feature specifications.

---

## ⚡ Application Health & Test Status

- **Automated Tests**: 73 passed, 4 test suites (`financialCalculations.test.ts`, `upiDetection.test.ts`, `storeActions.test.ts`, `recurringNotifications.test.ts`).
- **Framework**: React Native 0.86.3, Expo SDK ~57.0.27, React Navigation v7.
- **Offline Reliability**: 100% offline-first. Zero remote network dependencies.
- **Privacy Model**: Fully compliant on-device notification parsing with automatic OTP/noise rejection.

