---
sidebar_position: 2
---

# useIsCloudAvailable

The `useIsCloudAvailable` hook listens to changes in the availability of the cloud storage. For iCloud, it listens to native system events that notify you once iCloud becomes available or unavailable. The iCloud storage might become unavailable when, for example, the user logs out of iCloud. On Google Drive, this hook simply listens to changes of the access token set via [`setProviderOptions()`](../CloudStorage#setprovideroptionsoptions) and returns `true` if an access token is set, `false` otherwise.

This is helpful when you want to read from the cloud storage on app launch, as reading from iCloud without waiting for the storage to be available will block the main thread.

```ts
import { useIsCloudAvailable } from 'react-native-cloud-storage';
```

## API

**Parameters**:

- `cloudStorageInstance` ([`CloudStorage`](../CloudStorage)): Optional. An instance of [`CloudStorage`](../CloudStorage). If not specified, the default static instance will be used.

**Returns**: A `boolean` which is `true` if the cloud storage is online, `false` otherwise. For a more specific definition, [see here](../CloudStorage#iscloudavailable).
