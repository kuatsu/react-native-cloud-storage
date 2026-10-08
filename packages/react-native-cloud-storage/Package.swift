// swift-tools-version: 6.0
import PackageDescription

let reactHeaders: [Target.Dependency] = [
  .product(name: "ReactHeaders", package: "ReactNative"),
  .product(name: "ReactNativeHeaders", package: "ReactNative"),
  .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
]

let package = Package(
  name: "ReactNativeCloudStorage",
  platforms: [.iOS(.v15)],
  products: [
    .library(name: "ReactNativeCloudStorage", targets: ["ReactNativeCloudStorage"]),
  ],
  // React Native resolves these paths from build/generated/autolinking/libs/ReactNativeCloudStorage.
  dependencies: [
    .package(name: "ReactNative", path: "../../../../xcframeworks"),
    .package(name: "React-GeneratedCode", path: "../../../ios"),
  ],
  targets: [
    .target(
      // Keep the CocoaPods module name so both builds use the same Swift compatibility header.
      name: "react_native_cloud_storage",
      dependencies: reactHeaders,
      path: "ios",
      sources: [
        "CloudStorageCloudKit.swift",
        "CloudStorageKVStore.swift",
        "CloudStorageLocalFileSystem.swift",
        "Utils",
      ]
    ),
    .target(
      name: "ReactNativeCloudStorage",
      dependencies: reactHeaders + [
        "react_native_cloud_storage",
        .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
      ],
      path: "ios",
      sources: [
        "RCTCloudStorageCloudKit.mm",
        "RCTCloudStorageKVStore.mm",
        "RCTCloudStorageLocalFileSystem.mm",
      ],
      publicHeadersPath: ".",
      cxxSettings: [
        // Xcode-only path; remove when SwiftPM exposes generated Swift headers to Objective-C++.
        .unsafeFlags(["-I", "${GENERATED_MODULEMAP_DIR}"]),
        .define("DEBUG", .when(configuration: .debug)),
        .define("NDEBUG", .when(configuration: .release)),
      ]
    ),
  ],
  swiftLanguageModes: [.v5],
  cxxLanguageStandard: .cxx20
)
