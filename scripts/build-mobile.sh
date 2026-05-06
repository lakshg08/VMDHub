#!/bin/bash
set -e

TARGET=${1:-"android"}
echo "Building VMDHub Mobile ($TARGET)..."

cd packages/mobile

if [ "$TARGET" == "android" ]; then
  cd android && ./gradlew assembleRelease
  echo "Android APK → packages/mobile/android/app/build/outputs/apk/release/"
elif [ "$TARGET" == "ios" ]; then
  cd ios && pod install && cd ..
  xcodebuild -workspace ios/VMDHub.xcworkspace -scheme VMDHub -configuration Release archive -archivePath VMDHub.xcarchive
  echo "iOS archive → VMDHub.xcarchive"
fi
