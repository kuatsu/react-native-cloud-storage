package com.cloudstorage

sealed class CloudStorageError(
    val code: String,
    val message: String
) : Exception(message) {
    data class InvalidScope(val scope: String) : CloudStorageError(
        code = "ERR_INVALID_SCOPE",
        message = "Invalid scope $scope provided"
    )

    data class FileNotFound(val path: String) : CloudStorageError(
        code = "ERR_FILE_NOT_FOUND",
        message = "File not found at path $path"
    )

    data class PathIsDirectory(val path: String) : CloudStorageError(
        code = "ERR_PATH_IS_DIRECTORY",
        message = "Path is a directory at path $path"
    )

    data class PathIsFile(val path: String) : CloudStorageError(
        code = "ERR_PATH_IS_FILE",
        message = "Path is a file at path $path"
    )

    data class DirectoryNotFound(val path: String) : CloudStorageError(
        code = "ERR_DIRECTORY_NOT_FOUND",
        message = "Directory not found at path $path"
    )

    data class DirectoryNotEmpty(val path: String) : CloudStorageError(
        code = "ERR_DIRECTORY_NOT_EMPTY",
        message = "Directory not empty at path $path"
    )

    data class FileAlreadyExists(val path: String) : CloudStorageError(
        code = "ERR_FILE_EXISTS",
        message = "File already exists at path $path"
    )

    object AuthenticationFailed : CloudStorageError(
        code = "ERR_AUTHENTICATION_FAILED",
        message = "Authentication failed"
    )

    data class WriteError(val path: String) : CloudStorageError(
        code = "ERR_WRITE_ERROR",
        message = "Write error for path $path"
    )

    data class ReadError(val path: String) : CloudStorageError(
        code = "ERR_READ_ERROR",
        message = "Read error for path $path"
    )

    data class DeleteError(val path: String) : CloudStorageError(
        code = "ERR_DELETE_ERROR",
        message = "Delete error for path $path"
    )

    data class StatError(val path: String) : CloudStorageError(
        code = "ERR_STAT_ERROR",
        message = "Stat error for path $path"
    )

    data class FileNotDownloadable(val path: String) : CloudStorageError(
        code = "ERR_FILE_NOT_DOWNLOADABLE",
        message = "File not downloadable at path $path"
    )

    data class Unknown(val errorMessage: String = "An unknown error occurred") : CloudStorageError(
        code = "ERR_UNKNOWN",
        message = errorMessage
    )
}
