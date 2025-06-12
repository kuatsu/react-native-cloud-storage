/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CloudStorageErrorCode } from '../types/native';

class CloudStorageError extends Error {
  code: CloudStorageErrorCode;
  details?: any;

  constructor(message: string, code: CloudStorageErrorCode, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export default CloudStorageError;
