bash#!/bin/sh

set -e

echo "=== Installing CocoaPods dependencies ==="
# Script is in ios/ci_scripts/, parent is ios/ which is where we want to be
cd "$(dirname "$0")/.."
pod install
echo "=== Pods installed ==="
