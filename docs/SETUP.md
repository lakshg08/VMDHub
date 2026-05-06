# VMDHub Setup Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Git

For Desktop builds:
- Windows: No additional tools needed
- macOS: Xcode Command Line Tools

For Mobile builds:
- Android: Android Studio, JDK 17
- iOS (macOS only): Xcode 14+, CocoaPods

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/vmdhub/vmdhub.git
cd vmdhub
npm install

# 2. Start backend API
cd packages/backend
npm install
npm run dev

# 3. Start web app (new terminal)
cd packages/web
npm install
npm start

# 4. Or start desktop app
cd packages/desktop
npm install
npm run dev
```

## Environment Variables

### Backend
```bash
PORT=3001                    # API server port (default: 3001)
DB_PATH=/path/to/vmdhub.db  # Database file location
CORS_ORIGIN=http://localhost:3000
```

## Production Build

### Web
```bash
cd packages/web && npm run build
# Output: packages/web/build/
```

### Desktop
```bash
cd packages/desktop
npm run build        # All platforms
npm run build:win    # Windows .exe
npm run build:mac    # macOS .dmg
```

### Mobile
```bash
cd packages/mobile

# Android
npm run build:android
# Output: packages/mobile/android/app/build/outputs/apk/release/

# iOS (macOS only)
cd ios && pod install && cd ..
npm run build:ios
```
