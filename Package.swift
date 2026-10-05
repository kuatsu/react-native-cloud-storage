// swift-tools-version: 6.0
// HAND-WRITTEN split manifest (#3218 S11): this package mixes Swift and
// Objective-C(++) sources, which Swift Package Manager cannot compile in a
// single target. Measured import direction: the ObjC side registers/bridges the
// Swift classes (it imports the generated "-Swift.h"), so the ObjC(++) target
// depends on the Swift target and never the reverse. The bridging header only
// pulled in React/system headers, which the Swift target gets via the React
// headers products ("import React"), so no project-ObjC bridging remains.
import PackageDescription

let reactHeaders: [Target.Dependency] = [
    .product(name: "ReactHeaders", package: "ReactNative"),
    .product(name: "ReactNativeHeaders", package: "ReactNative"),
    .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
    .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
]

let package = Package(
    name: "ReactNativeCloudStorage",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "ReactNativeCloudStorage", targets: ["ReactNativeCloudStorageSwift", "ReactNativeCloudStorageObjC"]),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "ReactNativeCloudStorageSwift",
            dependencies: reactHeaders,
            path: ".",
            exclude: [
                "ios/CloudStorage-Bridging-Header.h",
                "ios/RCTCloudStorageCloudKit.mm",
                "ios/RCTCloudStorageKVStore.mm",
                "ios/RCTCloudStorageLocalFileSystem.mm",
                "ios/react_native_cloud_storage.h",
            ],
            sources: [
                      "ios/CloudStorageCloudKit.swift",
                      "ios/CloudStorageKVStore.swift",
                      "ios/CloudStorageLocalFileSystem.swift",
                      "ios/Utils/CloudKitUtils.swift",
                      "ios/Utils/CloudStorageError.swift",
                      "ios/Utils/FileUtils.swift",
                      "ios/Utils/Promise.swift",
                      "ios/Utils/Types.swift"
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
            ]
        ),
        .target(
            name: "ReactNativeCloudStorageObjC",
            dependencies: reactHeaders + ["ReactNativeCloudStorageSwift"],
            path: ".",
            sources: [
                "ios/CloudStorage-Bridging-Header.h",
                "ios/RCTCloudStorageCloudKit.mm",
                "ios/RCTCloudStorageKVStore.mm",
                "ios/RCTCloudStorageLocalFileSystem.mm",
                "ios/react_native_cloud_storage.h",
            ],
            publicHeadersPath: "ios",
            cSettings: [
                .headerSearchPath("ios"),
                .headerSearchPath("."),
                .unsafeFlags(["-include", "react-native-spm-prefix.h"]),
            ],
            cxxSettings: [
                .headerSearchPath("ios"),
                .headerSearchPath("."),
                .unsafeFlags(["-include", "react-native-spm-prefix.h"]),
                .define("DEBUG", .when(configuration: .debug)),
                .define("NDEBUG", .when(configuration: .release)),
            ],
            linkerSettings: [
                .linkedFramework("UIKit"),
                .linkedFramework("Foundation"),
                .linkedFramework("CoreGraphics"),
            ]
        ),
    ],
    swiftLanguageModes: [.v5],
    cxxLanguageStandard: .cxx20
)
