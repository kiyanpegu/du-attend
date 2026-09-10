# DU Attend 🎓

> Modern mobile attendance & academic schedule tracking application prototype for Dibrugarh University students and faculty. Built with React Native, Expo, and TypeScript.

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-blue.svg?style=flat-square)](#)

---

## 📱 Features

### 👨‍🎓 Student Portal
- **Dashboard Overview**: Real-time overall attendance ring, dynamic 75% safety status, and active class alerts.
- **Attendance Safety Advisor**: Exact mathematical calculator indicating safe classes you can miss (if $\ge 75\%$) or consecutive classes needed to recover exam eligibility (if $< 75\%$).
- **Live OTP Attendance**: Secure, one-tap attendance marking during live lecture sessions with cryptographic 6-digit OTP verification and rate limiting.
- **Academic Timetable**: Full weekly class schedule (BCA 1st Semester) with period ordering, lecture room numbers, and faculty details.
- **Course Breakdown & History**: Enrolled subject cards with expandable session logs, filterable audit history, and academic affiliation profile.

### 👩‍🏫 Faculty Console
- **Class Session Launch**: Select subjects and launch live OTP attendance sessions with real-time countdown timer.
- **Manual Attendance Fallback**: Quick student roster check-in for offline sessions or medical leave adjustments.
- **Class Records & Export**: View attendance logs, export class summaries, and track student trends.

### ⚙️ Prototype Administration
- Academic structure overview, student/faculty roster management, and prototype system resets.

---

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev) with [Expo](https://expo.dev) (Expo SDK 54 / Expo Router v6)
- **Language**: [TypeScript](https://www.typescriptlang.org) (strict type checking enabled)
- **Engine**: Hermes JavaScript Engine with full bytecode optimization
- **Security**: Cryptographic random OTP generation (`expo-crypto`) and encrypted session persistence (`expo-secure-store`)
- **State & Storage**: Serialized ACID-like atomic mutations with AsyncStorage and SecureStore fallbacks
- **Icons & Design**: Material Icons and SF Symbols cross-platform mapping with dark-mode university theme

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or newer recommended)
- Git
- [Expo Go](https://expo.dev/go) app installed on your iOS or Android device

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/kiyanpegu/du-attend.git
cd du-attend

# 2. Install dependencies
npm install

# 3. Start development server
npx expo start
```

Scan the generated QR code using **Expo Go** (Android) or the **Camera app** (iOS).

---

## 🧪 Automated Verification

The project includes an end-to-end automated test suite verifying all 14 core attendance and security rules:

```bash
# Run test suite
npm test

# Run TypeScript typecheck
npm run typecheck

# Run linter
npm run lint
```

---

## 🔑 Demo Credentials

| Role | Username / ID | Password | Scope / Affiliation |
| :--- | :--- | :--- | :--- |
| **Student** | `BCA001` | `student123` | BCA 1st Sem, Centre for Computer Science & Applications |
| **Faculty** | `FAC001` | `faculty123` | Faculty of Computer Science & Applications |
| **Admin** | `ADMIN001` | `admin123` | Academic Administration Console |

---

## 📜 Disclaimer

> **Independent Prototype**: This application is an independent student demonstration prototype. It is not an officially endorsed, approved, or operated application of Dibrugarh University. All student names, enrolment IDs, and records are synthetic development data.
