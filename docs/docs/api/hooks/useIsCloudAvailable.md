---
sidebar_position: 2
---

# useIsCloudAvailable

The `useIsCloudAvailable` hook periodically checks [`RNCloudStorage.isCloudAvailable()`](../RNCloudStorage#iscloudavailable) until the cloud storage is verified to be available. This is helpful when you want to read from the cloud storage on app launch, as reading from iCloud without waiting for the storage to be available will block the main thread.

The hook has a default timeout of 10 seconds after which the cloud storage will finally be deemed not available. This can be the case when the user is not logged into iCloud, for example.

```ts
import { useIsCloudAvailable } from { react-native-cloud-storage };
```

## API

**Parameters**:

- `timeout` (`number`): Optional. Timeout in seconds after which the cloud storage will finally be deemed offline. Defaults to 10 seconds.

**Returns**: A `boolean` which is `true` if the cloud storage is online, `false` otherwise. On platforms other than iOS, this will always be `true` ([see here](../RNCloudStorage#iscloudavailable))
