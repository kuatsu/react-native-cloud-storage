package com.cloudstorage

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class CloudStoragePackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      CloudStorageLocalFileSystemModule.NAME -> CloudStorageLocalFileSystemModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        CloudStorageLocalFileSystemModule.NAME to
          ReactModuleInfo(
            CloudStorageLocalFileSystemModule.NAME,
            CloudStorageLocalFileSystemModule::class.java.name,
            false,
            false,
            false,
            ReactModuleInfo.classIsTurboModule(CloudStorageLocalFileSystemModule::class.java)
          )
      )
    }
  }
}
