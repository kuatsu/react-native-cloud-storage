---
sidebar_position: 1
---

# Handling multiple files with the same name in Google Drive

Google Drive has a little peculiarity as in that there can be multiple files (or even directories) with the same name in the same parent directory. Under the hood, files are uniquely identified by a file ID instead of their name and directories are actually simply files with a custom MIME type. As iCloud does not behave in such a way, this library will default to the first file found to ensure best compatibility between the two cloud storages.

However, this might not always be desired by the user, especially when working in the [`CloudStorageScope.Documents` scope](../api/enums/CloudStorageScope).

:::tip

When only working in the `CloudStorageScope.AppData` scope, which should be the case for most apps (and which is also the default behavior of this library), you don't really need to pay attention to this issue as `react-native-cloud-storage` will never create multiple files with the same filename in the same directory. Therefore, this only becomes an issue within this scope if you're accessing the same app data container from outside `react-native-cloud-storage` and create multiple files with the same filename yourself.

:::

This library accounts for this behavior by providing two ways of dealing with this:

## Throwing an error

By default, the library will not throw when there are multiple files with the same name detected but instead default to the first one returned by the Google Drive API. You can however opt into throwing. Please note however that this will render the library completely useless for such cases until the user manually "fixed" this by renaming the files in his Google Drive, as the library will throw before performing any actions such as writing or reading. Behind the scenes, the library will always list all files first to get the file id of the given pathname in order to perform actual actions on this file. Throwing an error will already occur when there are multiple files with the same name detected on this step.

If you do wish to enable throwing, simply call [`CloudStorage.setThrowOnFilesWithSameName(true)`](../api/CloudStorage#setthrowonfileswithsamenameenable). The library will then throw a [`CloudStorageError`](../api/CloudStorageError) with the code [`CloudStorageErrorCode.MULTIPLE_FILES_SAME_NAME`](../api/enums/CloudStorageErrorCode). Again, this will only affect Google Drive and not have any effect on iOS devices as iCloud does not allow same filenames on different files within the same directory.

## Subscribe to an event

A much more flexible option to throwing is listening to events published by the library when detecting files with the same filename. File operations are then performed anyways, but your app will be notified when such an event happens and can therefore display a warning to the user, for example, and optionally rollback any changes made (you're responsible for backing up previous data in this case!).

:::info

Events are only published when the throwing option is disabled.

:::

To subscribe, simply add a listener like this:

```ts
const subscription = CloudStorage.subscribeToFilesWithSameName(({ path, fileIds }) => {
  console.log(`There are multiple files with the path ${path}!`, { fileIds });
});

// to unsubscribe again
subscription.remove();
```

See also the [API documentation](../api/CloudStorage#subscribetofileswithsamenamesubscriber).
