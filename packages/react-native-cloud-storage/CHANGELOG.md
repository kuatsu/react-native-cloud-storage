# Changelog

## [3.2.0](https://github.com/kuatsu/react-native-cloud-storage/compare/v3.1.1...v3.2.0) (2026-10-08)

### ✨ Features

* **ios:** add SwiftPM support ([b14d66f](https://github.com/kuatsu/react-native-cloud-storage/commit/b14d66f037f74c839e26a4df63f2120b99a6bc80))

## [3.1.1](https://github.com/kuatsu/react-native-cloud-storage/compare/v3.1.0...v3.1.1) (2026-10-02)


### 🐛 Bug Fixes

* **android:** skip explicit Kotlin plugin when AGP registers the kotlin extension ([#85](https://github.com/kuatsu/react-native-cloud-storage/issues/85)) ([13f40bb](https://github.com/kuatsu/react-native-cloud-storage/commit/13f40bb49048340104d04abe13a005df2df84863))
* **example:** decode local file paths ([ad2d399](https://github.com/kuatsu/react-native-cloud-storage/commit/ad2d399f70cb7848cd6c5044fc62e96748a35c75))
* **example:** report transfer progress correctly ([e9858dc](https://github.com/kuatsu/react-native-cloud-storage/commit/e9858dc542e09a222d9fe04f69b31c403f1e0632))
* forward download paths and scopes correctly ([105ab13](https://github.com/kuatsu/react-native-cloud-storage/commit/105ab13574bcf2ebfba770277af7c3cc28fcba3c))
* **ios:** accept file URLs for local transfers ([7f028ee](https://github.com/kuatsu/react-native-cloud-storage/commit/7f028ee0450e4a518a692e1f25700caf2e1fa17b))
* **ios:** coordinate cloud file reads and writes ([87b6fa4](https://github.com/kuatsu/react-native-cloud-storage/commit/87b6fa41f22046da014534ac6f82d8a9e60f085a))
* **ios:** discover cloud files through metadata queries ([bc28245](https://github.com/kuatsu/react-native-cloud-storage/commit/bc28245c19813de08877c50803ebd7a05a51eeb4))
* **ios:** keep local paths in upload errors ([884bc86](https://github.com/kuatsu/react-native-cloud-storage/commit/884bc86e3fc185e83b013c3f76a80d442759a2a6))
* **ios:** preserve file and download errors ([226f781](https://github.com/kuatsu/react-native-cloud-storage/commit/226f781efe2dde43cca9508f54347d7fafcc3fb2))
* **ios:** resolve remote files before append and delete ([e2fb63b](https://github.com/kuatsu/react-native-cloud-storage/commit/e2fb63babaa436999955856e3d8908534601ffe4))

# [3.1.0](https://github.com/kuatsu/react-native-cloud-storage/compare/v3.0.1...v3.1.0) (2026-08-11)


### Bug Fixes

* **web:** make library importable under react-native-web ([d231194](https://github.com/kuatsu/react-native-cloud-storage/commit/d231194f671e2b273d1a75b1211686279dd082f0))


### Features

* Implement KV storage ([#76](https://github.com/kuatsu/react-native-cloud-storage/issues/76)) ([ef452b7](https://github.com/kuatsu/react-native-cloud-storage/commit/ef452b76821e4ee6bdcc6e5c8d5c9cb23413e29f))

## [3.0.1](https://github.com/kuatsu/react-native-cloud-storage/compare/v3.0.0...v3.0.1) (2026-06-21)


### Bug Fixes

* **ci:** fix workflow ([cef99fc](https://github.com/kuatsu/react-native-cloud-storage/commit/cef99fc34dea025415f7d148978fcdd2997d89b8))
* **ios:** install ubiquity observer only after emitter callback is bound ([eb18b00](https://github.com/kuatsu/react-native-cloud-storage/commit/eb18b00c8d69e0b932a3387ed1d2641698a44eda)), closes [#59](https://github.com/kuatsu/react-native-cloud-storage/issues/59) [#59](https://github.com/kuatsu/react-native-cloud-storage/issues/59)

# [3.0.0](https://github.com/kuatsu/react-native-cloud-storage/compare/v2.3.0...v3.0.0) (2026-02-26)


### Bug Fixes

* fix issues with root directory operations on Google Drive ([#57](https://github.com/kuatsu/react-native-cloud-storage/issues/57)) ([b7259ee](https://github.com/kuatsu/react-native-cloud-storage/commit/b7259ee19773e2596445c5728a520cfb32e46991))
* **ios:** use iCloud Documents folder for Documents scope ([#54](https://github.com/kuatsu/react-native-cloud-storage/issues/54)) ([f2b3f5b](https://github.com/kuatsu/react-native-cloud-storage/commit/f2b3f5ba635af144e7230b799618e961e337ef02)), closes [#53](https://github.com/kuatsu/react-native-cloud-storage/issues/53)


### Features

* improve Google Drive API performance ([015b408](https://github.com/kuatsu/react-native-cloud-storage/commit/015b408339a716c089c246e8b24bc97ce9cc768a))
* migrate package to Turbo Modules ([#56](https://github.com/kuatsu/react-native-cloud-storage/issues/56)) ([158a856](https://github.com/kuatsu/react-native-cloud-storage/commit/158a8566c19c6dd9888c063debec34ad54c1c059))

# [2.3.0](https://github.com/kuatsu/react-native-cloud-storage/compare/v2.2.2...v2.3.0) (2025-06-14)


### Features

* add binary file support ([#43](https://github.com/kuatsu/react-native-cloud-storage/issues/43)) ([59cf1fa](https://github.com/kuatsu/react-native-cloud-storage/commit/59cf1faa7dd0ec1a545a4482039e9b32fdc14a4f))
