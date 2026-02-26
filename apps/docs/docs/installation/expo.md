---
sidebar_position: 1
---

# Install in Expo Managed project

:::caution

This library is not compatible with Expo Go. You need to use a [development client](https://docs.expo.dev/development/create-development-builds/).

:::

:::info

Newer versions of this library are only compatible with the New Architecture. If you're still using the Legacy Architecture, [consider migrating to the New Architecture](https://reactnative.dev/blog/2024/10/23/the-new-architecture-is-here). If you can't migrate yet, you can continue using version 2 of this library, which is compatible with both the New and Legacy Architectures. You can install it using `npm install react-native-cloud-storage@^2` or `yarn add react-native-cloud-storage@^2`.

:::

First, install the library using your favorite package manager:

```sh
npm install react-native-cloud-storage
# or
yarn add react-native-cloud-storage
```

Because this library includes native code, you will need to use an [Expo development client](https://docs.expo.dev/development/create-development-builds/). In order to make necessary changes to the iOS files, this library provides an Expo config plugin which makes those changes for you upon build. To use it, simply add the library to the `plugins` section of your `app.json`:

```json
{
  "expo": {
    "plugins": ["react-native-cloud-storage"]
  }
}
```

There are a few options you can pass to the config plugin:

- `iCloudContainerEnvironment`: Set the iCloud container environment. Can be `Production` or `Development`. Defaults to `Production`. [Learn more about this option.](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment)
- `iCloudContainerIdentifier`: Manually set the iCloud container identifier. If not set, the container identifier will be derived from the app's bundle identifier (`iCloud.$BUNDLE_IDENTIFIER`).

**Example:**

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-cloud-storage",
        {
          "iCloudContainerEnvironment": "Development",
          "iCloudContainerIdentifier": "iCloud.mycompany.icloud"
        }
      ]
    ]
  }
}
```

Finally, rebuild your development client and proceed with [the Google Drive configuration](./configure-google-drive).
