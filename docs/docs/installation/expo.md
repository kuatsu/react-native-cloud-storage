---
sidebar_position: 1
---

# Install in Expo Managed project

:::caution

This library is not compatible with Expo Go. You need to use a [development client](https://docs.expo.dev/development/create-development-builds/).

:::

First, install the library using your favorite package manager:

```sh
npm install react-native-cloud-storage
# or
yarn add react-native-cloud-storage
```

Because this library includes native iOS code, you will need to use an [Expo development client](https://docs.expo.dev/development/create-development-builds/). In order to make the necessary changes to the iOS files, this library provides an Expo config plugin which makes those changes for you upon build. To use it, simply add the library to the `plugins` section of your `app.json`:

```json
{
  "expo": {
    "plugins": ["react-native-cloud-storage"]
  }
}
```

Optionally, you can also configure the `iCloudContainerEnvironment` option using the config plugin (defaults to `Production`):

```json
{
  "expo": {
    "plugins": [["react-native-cloud-storage", { "iCloudContainerEnvironment": "Development" }]]
  }
}
```

[Learn more about this option.](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment)

Finally, rebuild your development client and proceed with [the Android configuration](./configure-android).
