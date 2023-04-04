---
sidebar_position: 3
---

# StorageScope

`StorageScope` is a TypeScript enum containing the possible values for the `scope` parameters of the rest of the API.

```ts
import { StorageScope } from 'react-native-cloud-storage';
```

## Definition

```ts
enum StorageScope {
  Documents = 'documents',
  Hidden = 'hidden',
}
```

When using pure JavaScript, simply use the appropriate values:

```js
RNCloudStorage.exists('test.txt', 'documents');
```
