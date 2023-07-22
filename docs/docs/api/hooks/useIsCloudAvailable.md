---
sidebar_position: 2
---

# useIsCloudAvailable

The `useIsCloudAvailable` hook periodically checks [`CloudStorage.isCloudAvailable()`](../CloudStorage#iscloudavailable) until the cloud storage is verified to be available. This is helpful when you want to read from the cloud storage on app launch, as reading from iCloud without waiting for the storage to be available will block the main thread.

On iOS, the hook has a default timeout of 10 seconds after which iCloud will finally be deemed not available. This can be the case when the user is not logged into iCloud, for example.

```ts
import { useIsCloudAvailable } from { react-native-cloud-storage };
```

## API

**Parameters**:

- `iCloudTimeout` (`number`): Optional. Timeout in seconds after which iCloud will finally be deemed not available. Defaults to 10 seconds.

**Returns**: A `boolean` which is `true` if the cloud storage is online, `false` otherwise. For a more specific definition, ([see here](../CloudStorage#iscloudavailable))
