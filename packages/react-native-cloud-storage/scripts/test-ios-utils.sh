#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

directory=$(mktemp -d)
trap 'rm -rf "$directory"' EXIT
swiftc ios/Utils/CloudStorageError.swift ios/Utils/Types.swift ios/Utils/FileUtils.swift \
  ios/Utils/CloudKitUtils.swift src/__tests__/ios/main.swift -o "$directory/test-ios-utils"
"$directory/test-ios-utils"
