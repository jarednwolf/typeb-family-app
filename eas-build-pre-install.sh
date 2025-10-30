#!/usr/bin/env bash
set -euo pipefail

if [ -d "ios" ]; then
  echo "[eas-build-pre-install] Updating CocoaPods specs repo..."
  cd ios
  pod repo update
  cd - >/dev/null
fi
