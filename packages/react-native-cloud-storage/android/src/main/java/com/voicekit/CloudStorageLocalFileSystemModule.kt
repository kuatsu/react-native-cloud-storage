package com.cloudstorage

import com.facebook.react.bridge.*
import java.io.File
import java.io.IOException
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.Response
import okio.buffer
import okio.sink
import java.net.URLConnection

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

  @ReactMethod
  fun downloadFile(remoteUri: String, localPath: String, options: ReadableMap?, promise: Promise) {
    val client = OkHttpClient()
    val requestBuilder = Request.Builder()

    try {
      requestBuilder.url(remoteUri)
    } catch (e: IllegalArgumentException) {
      val error = CloudStorageError.InvalidUrl(remoteUri)
      promise.reject(error.code, error.message, e)
      return
    }

    if (options?.hasKey("headers") == true) {
      val headers = options.getMap("headers")
      val iterator = headers?.keySetIterator()
      while (iterator?.hasNextKey() == true) {
        val key = iterator.nextKey()
        requestBuilder.addHeader(key, headers.getString(key)!!)
      }
    }

    val request = requestBuilder.build()

    client.newCall(request).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        val errorMessage = "Download error for path $remoteUri: ${e.message ?: "Unknown download error"}"
        val error = CloudStorageError.NetworkError(errorMessage)
        promise.reject(error.code, error.message, e)
      }

      override fun onResponse(call: Call, response: Response) {
        if (!response.isSuccessful) {
          val errorMessage = "Download error for path $remoteUri: HTTP ${response.code}: ${response.message}"
          val error = CloudStorageError.NetworkError(errorMessage)
          promise.reject(error.code, error.message)
          return
        }

        try {
          val localFile = File(localPath)
          val parentDir = localFile.parentFile
          if (parentDir != null && !parentDir.exists()) {
            parentDir.mkdirs()
          }

          val sink = localFile.sink().buffer()
          sink.writeAll(response.body!!.source())
          sink.close()
          promise.resolve(null)
        } catch (e: Exception) {
          val error = CloudStorageError.WriteError(localPath)
          promise.reject(error.code, error.message, e)
        } finally {
          response.body?.close()
        }
      }
    })
  }

  @ReactMethod
  fun uploadFile(localPath: String, remoteUri: String, options: ReadableMap, promise: Promise) {
    val localFile = File(localPath)
    if (!localFile.exists()) {
      promise.reject(CloudStorageError.FileNotFound(localPath).code, CloudStorageError.FileNotFound(localPath).message)
      return
    }

    val uploadTypeString = options.getString("uploadType")
    if (uploadTypeString == null) {
      promise.reject(CloudStorageError.Unknown("uploadType is required").code, CloudStorageError.Unknown("uploadType is required").message)
      return
    }

    val uploadType = try {
      UploadType.valueOf(uploadTypeString.uppercase())
    } catch (e: IllegalArgumentException) {
      promise.reject(CloudStorageError.Unknown("Invalid uploadType: $uploadTypeString").code, CloudStorageError.Unknown("Invalid uploadType: $uploadTypeString").message)
      return
    }

    val client = OkHttpClient()
    val requestBuilder = Request.Builder()

    try {
      requestBuilder.url(remoteUri)
    } catch (e: IllegalArgumentException) {
      val error = CloudStorageError.InvalidUrl(remoteUri)
      promise.reject(error.code, error.message, e)
      return
    }

    if (options.hasKey("headers")) {
      options.getMap("headers")?.let { headers ->
        headers.keySetIterator().forEach { key ->
          requestBuilder.addHeader(key, headers.getString(key)!!)
        }
      }
    }

    val httpMethod = options.getString("method")?.uppercase() ?: "POST"

    val requestBody = when (uploadType) {
      UploadType.BINARY -> {
        val mediaType = URLConnection.guessContentTypeFromName(localFile.name)?.toMediaTypeOrNull()
          ?: "application/octet-stream".toMediaTypeOrNull()
        localFile.asRequestBody(mediaType)
      }
      UploadType.MULTIPART -> {
        val fieldName = options.getString("fieldName")
        if (fieldName == null) {
          promise.reject(CloudStorageError.Unknown("fieldName is required for multipart uploads").code, CloudStorageError.Unknown("fieldName is required for multipart uploads").message)
          return
        }

        val mediaType = URLConnection.guessContentTypeFromName(localFile.name)?.toMediaTypeOrNull()
          ?: "application/octet-stream".toMediaTypeOrNull()

        val multipartBodyBuilder = MultipartBody.Builder()
          .setType(MultipartBody.FORM)
          .addFormDataPart(fieldName, localFile.name, localFile.asRequestBody(mediaType))

        if (options.hasKey("parameters")) {
          options.getMap("parameters")?.let { parameters ->
            parameters.keySetIterator().forEach { key ->
              multipartBodyBuilder.addFormDataPart(key, parameters.getString(key)!!)
            }
          }
        }
        multipartBodyBuilder.build()
      }
    }

    requestBuilder.method(httpMethod, requestBody)
    val request = requestBuilder.build()

    client.newCall(request).enqueue(object : Callback {
      override fun onFailure(call: Call, e: IOException) {
        val errorMessage = "Upload error for path $localPath: ${e.message ?: "Unknown upload error"}"
        val error = CloudStorageError.NetworkError(errorMessage)
        promise.reject(error.code, error.message, e)
      }

      override fun onResponse(call: Call, response: Response) {
        if (!response.isSuccessful) {
          val errorMessage = "Upload error for path $localPath: HTTP ${response.code}: ${response.message}"
          val error = CloudStorageError.NetworkError(errorMessage)
          promise.reject(error.code, error.message)
        } else {
          promise.resolve(null)
        }
        response.body?.close()
      }
    })
  }

  companion object {
    const val NAME = "CloudStorageLocalFileSystem"
  }
}
