# react-native-cloud-storage

Save & read from iCloud and Google Drive using React Native

**WARNING**: This project is still under construction. Please use with caution until it is published to the NPM registry.

## Installation

```sh
npm install react-native-cloud-storage@https://github.com/Kuatsu/react-native-cloud-storage.git
```

### Using Expo

This module contains native code. To make it work with Expo, we provide an Expo config plugin. To install it, simply add it to the appropriate `plugins` section of your `app.json`:

```json
{
  "expo": {
    // ...
    "plugins": ["react-native-cloud-storage"]
  }
}
```

Optionally, you can also configure the `iCloudContainerEnvironment` option using the config plugin (defaults to `Production`):

```json
{
  "expo": {
    // ...
    "plugins": [["react-native-cloud-storage", { "iCloudContainerEnvironment": "Development" }]]
  }
}
```

**Note**: To use a config plugin, you need to use a [development client](https://docs.expo.dev/development/create-development-builds/).

### Not using Expo

If you're not using Expo, you will need to manually configure your iOS project. First, install the pods:

```sh
  cd ios && pod install && cd ..
```

Then, you will first need to add the iCloud entitlement to your project. Open your Xcode workspace/project and select your project target. Open the section "Signing & Capabilities" and add the iCloud capability. From the capability settings, enable "iCloud Documents". Finally, add a new container using the plus symbol using the name `iCloud.{your.bundle}` where `{your.bundle}` should be replaced with your bundle identifier.

Google Drive support for Android does not use native code and is implemented in pure JavaScript using the Google Drive REST API. No further installation steps are needed.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## Example Project

There's a demo application available within the `example` directory. To use it under Android, you'll need to provide a valid access token for the Google Drive API. You can create one using the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
