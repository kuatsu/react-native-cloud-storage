---
sidebar_position: 1
---

# Install in Expo Managed project

:::caution

This library is not compatible with Expo Go for iOS. You need to use a [development client](https://docs.expo.dev/development/create-development-builds/).

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

While this library does not contain any native Android code, it's best practice to also use development clients on Android from this point forward if you're not already doing so anyways.

Finally, rebuild your development client and proceed with [the Google Drive configuration](./configure-google-drive).
