#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

directory=$(mktemp -d)
trap 'rm -rf "$directory"' EXIT
sources=(ios/Utils/CloudStorageError.swift ios/Utils/Types.swift ios/Utils/FileUtils.swift ios/Utils/CloudKitUtils.swift)
swiftc "${sources[@]}" src/__tests__/ios/main.swift -o "$directory/test-ios-utils"
"$directory/test-ios-utils"
xcrun swiftc -typecheck -target arm64-apple-ios15.1-simulator \
  -sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" "${sources[@]}"
