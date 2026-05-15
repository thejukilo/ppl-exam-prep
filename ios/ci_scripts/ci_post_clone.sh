#!/bin/sh

set -e

# Skip Homebrew chatter
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_ENV_HINTS=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

echo "=== Checking Node ==="
if ! command -v node > /dev/null 2>&1; then
  echo "Node not found, installing via Homebrew"
  brew install node
else
  echo "Node already present: $(node --version)"
fi

echo "=== Installing npm dependencies ==="
cd "$CI_PRIMARY_REPOSITORY_PATH"
if [ -f "package-lock.json" ]; then
  npm ci --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi

echo "=== Installing CocoaPods dependencies ==="
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

echo "=== Done ==="
