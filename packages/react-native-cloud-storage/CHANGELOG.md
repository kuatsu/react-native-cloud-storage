# Changelog

## [3.3.0](https://github.com/kuatsu/react-native-cloud-storage/compare/v3.2.0...v3.3.0) (2026-10-23)

### ✨ Features

* **example:** add file and byte transfer controls ([a88e672](https://github.com/kuatsu/react-native-cloud-storage/commit/a88e67276a1237cc8ea00d50b891c469af851a16))
* **google-drive:** support access token callbacks ([3f0f28f](https://github.com/kuatsu/react-native-cloud-storage/commit/3f0f28f53dc4e2062f96c6b3fc09a5ba3611f0c7))
* support in-memory binary file operations ([d992500](https://github.com/kuatsu/react-native-cloud-storage/commit/d99250066ea698e0faac2455e1dce5b03858fdb7))

### ⚡ Performance Improvements

* **google-drive:** batch KV writes and removals into one document update ([5f14028](https://github.com/kuatsu/react-native-cloud-storage/commit/5f14028ffc861fdcf4788bf8eddc1f523b7dc1d1))

### 🐛 Bug Fixes

* **example:** join file paths without duplicate slashes ([6ad79d3](https://github.com/kuatsu/react-native-cloud-storage/commit/6ad79d39eee901944bf346cf51ba940b4c354e86))
* **google-drive:** detect duplicates in parent directories ([696527c](https://github.com/kuatsu/react-native-cloud-storage/commit/696527cb0fc4e794d71ca0ccbe930485ba309f74))
* **google-drive:** improve error handling and report rate/quota limits ([152e731](https://github.com/kuatsu/react-native-cloud-storage/commit/152e73115e59d75e1713128ab03ce3eca80d210b))
* **google-drive:** normalize repeated path separators ([f5c1426](https://github.com/kuatsu/react-native-cloud-storage/commit/f5c1426a8b69b99662d74799cb1d6f0ac70a4c76))
* **google-drive:** preserve all keys in KV storage ([84131cc](https://github.com/kuatsu/react-native-cloud-storage/commit/84131cc7c2672975295613ce0e240121ac100fee))
* **google-drive:** rediscover missing and replaced KV documents ([abe81d5](https://github.com/kuatsu/react-native-cloud-storage/commit/abe81d5896d736ef1fede21ea40a28bc1d750cab))
* **google-drive:** select duplicates in file ID order ([b9e923f](https://github.com/kuatsu/react-native-cloud-storage/commit/b9e923fa2c2816916e1d83b71d26d261fc7f5393))
* **hooks:** prevent stale operations from replacing current file content ([5402ce5](https://github.com/kuatsu/react-native-cloud-storage/commit/5402ce5bbae0a051d52e0dbd3a1867cb6938bf89))
* **icloud:** enforce file and directory deletion rules ([cee285f](https://github.com/kuatsu/react-native-cloud-storage/commit/cee285f595bf8d9cdbbf995f27239d70c5a65eff))
* **ios:** preserve local files when downloads fail ([bd6da10](https://github.com/kuatsu/react-native-cloud-storage/commit/bd6da1098ec7bece3bb866f08f3e13e70fc825f0))

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
