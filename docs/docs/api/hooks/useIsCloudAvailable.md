---
sidebar_position: 2
---

# useIsCloudAvailable

The `useIsCloudAvailable` hook listens to changes in the availability of iCloud. On iOS, it listens to native system events that notify you once iCloud becomes available or unavailable. The iCloud storage might become unavailable when, for example, the user logs out of iCloud. On all other platforms, this hook simply listens to changes of the Google Drive access token set via [`setGoogleDriveAccessToken()`](../CloudStorage#setgoogledriveaccesstokenaccesstoken) and returns `true` if an access token is set, `false` otherwise.

This is helpful when you want to read from the cloud storage on app launch, as reading from iCloud without waiting for the storage to be available will block the main thread.

```ts
import { useIsCloudAvailable } from { react-native-cloud-storage };
```

## API

**Returns**: A `boolean` which is `true` if the cloud storage is online, `false` otherwise. For a more specific definition, ([see here](../CloudStorage#iscloudavailable))
