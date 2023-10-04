---
sidebar_position: 1
---

# CloudStorageScope

`CloudStorageScope` is a TypeScript enum containing the possible values for the `scope` parameters of the rest of the API.

Available scopes are `documents` and `app_data`. When using `documents`, data will be stored in the user-visible root directory of the cloud storage. When using `app_data`, the directory for app-specific data, usually hidden from the user, will be used.

```ts
import { CloudStorageScope } from 'react-native-cloud-storage';
```

## Definition

```ts
enum CloudStorageScope {
  Documents = 'documents',
  AppData = 'app_data',
}
```

When using pure JavaScript, simply use the appropriate values:

```js
CloudStorage.exists('/test.txt', 'documents');
```
