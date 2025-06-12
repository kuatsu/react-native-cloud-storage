/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NativeCloudStorageErrorCode } from '../types/native';

class CloudStorageError extends Error {
  code: NativeCloudStorageErrorCode;
  details?: any;

  constructor(message: string, code: NativeCloudStorageErrorCode, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export default CloudStorageError;
