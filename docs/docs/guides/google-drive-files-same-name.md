---
sidebar_position: 1
---

# Handling multiple files with the same name in Google Drive

Google Drive has a little peculiarity as in that there can be multiple files (or even directories) with the same name in the same parent directory. Under the hood, files are uniquely identified by a file ID instead of their name and directories are actually simply files with a custom MIME type. As iCloud does not behave in such a way, this library will default to the first file found to ensure best compatibility between the two cloud storages.

However, this might not always be desired by the user, especially when working in the [`CloudStorageScope.Documents` scope](../api/enums/CloudStorageScope).

:::tip

When only working in the `CloudStorageScope.AppData` scope, which should be the case for most apps (and which is also the default behavior of this library), you don't really need to pay attention to this issue as `react-native-cloud-storage` will never create multiple files with the same filename in the same directory. Therefore, this only becomes an issue within this scope if you're accessing the same app data container from outside `react-native-cloud-storage` and create multiple files with the same filename yourself.

:::

## Throwing an error

By default, the library will not throw when there are multiple files with the same name detected but instead default to the first one returned by the Google Drive API. You can however opt into throwing. Please note however that this will render the library completely useless for such cases until the user manually "fixed" this by renaming the files in his Google Drive, as the library will throw before performing any file operations. Behind the scenes, the library will always list all files first to get the file id of the given pathname in order to perform actual actions on this file. Throwing an error will already occur when there are multiple files with the same name detected on this step.

If you do wish to enable throwing, simply call [`CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { strictFilenames: true })`](../api/CloudStorage#setprovideroptionsprovider-options). The library will then throw a [`CloudStorageError`](../api/CloudStorageError) with the code [`CloudStorageErrorCode.MULTIPLE_FILES_SAME_NAME`](../api/enums/CloudStorageErrorCode). Again, this will only affect Google Drive and not have any effect on other providers such as iCloud, which do not allow same filenames on different files within the same directory.
