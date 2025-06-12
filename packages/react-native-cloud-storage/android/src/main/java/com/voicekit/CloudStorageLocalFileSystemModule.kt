package com.cloudstorage

import com.facebook.react.bridge.*
import java.io.File

class CloudStorageLocalFileSystemModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun createTemporaryFile(filename: String, data: String, promise: Promise) {
    try {
      val temporaryDirectory = FileUtils.getTemporaryDirectory(reactContext)
      val file = File(temporaryDirectory, filename)
      FileUtils.writeFile(file, data)
      promise.resolve(file.path)
    } catch (e: CloudStorageError) {
      promise.reject(e.code, e.message, e)
    } catch (e: Exception) {
      val unknownError = CloudStorageError.Unknown(e.message ?: "An unknown error occurred")
      promise.reject(unknownError.code, unknownError.message, e)
    }
  }

  @ReactMethod
  fun readFile(path: String, promise: Promise) {
    try {
      val file = File(path)
      val content = FileUtils.readFile(file)
      promise.resolve(content)
    } catch (e: CloudStorageError) {
      promise.reject(e.code, e.message, e)
    } catch (e: Exception) {
      val unknownError = CloudStorageError.Unknown(e.message ?: "An unknown error occurred")
      promise.reject(unknownError.code, unknownError.message, e)
    }
  }

  companion object {
    const val NAME = "CloudStorageLocalFileSystem"
  }
}
