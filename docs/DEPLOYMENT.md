# VMDHub Deployment Guide

## Web App Deployment

### Build
```bash
cd packages/web && npm run build
```
Output in `packages/web/build/` — serve as static files with any web server.

### Nginx example
```nginx
server {
  listen 80;
  root /var/www/vmdhub;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /api { proxy_pass http://localhost:3001; }
}
```

## Backend Deployment

### PM2
```bash
npm install -g pm2
cd packages/backend
pm2 start src/server.js --name vmdhub-api
pm2 save
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY packages/backend/package*.json ./
RUN npm ci --production
COPY packages/backend/src ./src
COPY packages/shared ./node_modules/@vmd/shared
EXPOSE 3001
CMD ["node", "src/server.js"]
```

## Desktop Distribution

### Windows
Build produces `dist/VMDHub Setup 1.0.0.exe` (NSIS installer)

### macOS
Build produces `dist/VMDHub-1.0.0.dmg`

Sign for distribution:
```bash
export CSC_LINK=path/to/certificate.p12
export CSC_KEY_PASSWORD=password
npm run build:mac
```

## Mobile Distribution

### Android (Google Play)
```bash
cd packages/mobile/android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

### iOS (App Store)
```bash
cd packages/mobile/ios
pod install
xcodebuild -workspace VMDHub.xcworkspace -scheme VMDHub archive
```
