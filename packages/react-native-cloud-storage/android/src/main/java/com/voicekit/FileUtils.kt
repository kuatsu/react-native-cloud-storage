package com.cloudstorage

import android.content.Context
import java.io.File
import java.io.IOException

object FileUtils {
  fun getTemporaryDirectory(context: Context): File {
    return context.cacheDir
  }

  fun writeFile(file: File, content: String) {
    try {
      file.writeText(content, Charsets.UTF_8)
    } catch (e: IOException) {
      throw CloudStorageError.WriteError(file.path)
    }
  }

  fun readFile(file: File): String {
    if (!file.exists()) {
      throw CloudStorageError.FileNotFound(file.path)
    }
    try {
      return file.readText(Charsets.UTF_8)
    } catch (e: IOException) {
      throw CloudStorageError.ReadError(file.path)
    }
  }

  fun sanitizePath(path: String): String {
    // Remove the "file://" prefix
    val sanitizedPath = path.removePrefix("file://")

    return try {
      File(sanitizedPath).canonicalPath
    } catch (e: IOException) {
      throw CloudStorageError.InvalidUrl(path)
    }
  }
}
