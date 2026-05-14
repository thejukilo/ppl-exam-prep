#!/bin/sh

# Xcode Cloud runs this script after cloning the repo.
# Generates the iOS project via expo prebuild and installs CocoaPods deps.

set -e  # exit on any error

echo "=== ci_post_clone.sh starting ==="

# Navigate to the mobile folder (script is in mobile/ci_scripts/)
cd "$CI_PRIMARY_REPOSITORY_PATH/mobile"

echo "=== Installing Node dependencies ==="
npm install --legacy-peer-deps

echo "=== Running expo prebuild for iOS ==="
# --no-install: skip running pod install here, we do it ourselves below
npx expo prebuild --platform ios --clean --no-install

echo "=== Installing CocoaPods ==="
cd ios
pod install
cd ..

echo "=== ci_post_clone.sh done ==="