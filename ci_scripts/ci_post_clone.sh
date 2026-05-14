#!/bin/sh

set -e

echo "=== Installing CocoaPods dependencies ==="
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
echo "=== Pods installed ==="
