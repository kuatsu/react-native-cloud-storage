import type { NativeStorageErrorCode } from '../types/native';

class NativeStorageError extends Error {
  code: NativeStorageErrorCode;
  details?: any;

  constructor(message: string, code: NativeStorageErrorCode, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export default NativeStorageError;
