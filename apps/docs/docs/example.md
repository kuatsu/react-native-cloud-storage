---
sidebar_position: 5
---

# Example Project

An example project is available within the [`example` directory](https://github.com/Kuatsu/react-native-cloud-storage/tree/master/example) of the GitHub repository. It demonstrates all functionality the library provides.

## iOS Setup

When setting up the example project for iOS, you will need to follow the [iOS installation steps](./installation/react-native) in order to provide your own iCloud container.

## Android Setup

If you want to set up the example project for Android, you'll need a valid access token for the Google Drive API. You can create one using the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground). Select the following scopes from "Drive API v3":

- https://www.googleapis.com/auth/drive (if you want to use `CloudStorageScope.Documents`)
- https://www.googleapis.com/auth/drive.appdata

Then generate an authorization code and exchange it for an access token. Once you have the access token, you can make your life easier by using `adb shell input text '{some_token}'` if you're using an emulator, which feeds the token into it (make sure to tap into the text input field first).
