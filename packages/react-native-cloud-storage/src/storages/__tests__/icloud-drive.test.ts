import { afterEach, expect, it, vi } from 'vitest';
import { NativeICloudDrive, NativeICloudDriveModule } from '../icloud-drive';

vi.mock('../../specs/NativeCloudStorageICloudDriveIOS', () => ({
  default: { readBytes: vi.fn(), writeBytes: vi.fn() },
}));

afterEach(() => vi.resetAllMocks());

it('passes buffer slices to iCloud and returns native-backed byte views', async () => {
  const bytes = new Uint8Array([9, 0, 128, 255, 9]).subarray(1, 4);
  await NativeICloudDrive!.createFile('/file', bytes, 'app_data', true, 'application/octet-stream');
  expect(NativeICloudDriveModule!.writeBytes).toHaveBeenLastCalledWith('/file', bytes.buffer, 1, 3, 'app_data', true);

  const buffer = new Uint8Array([0, 128, 255]).buffer;
  vi.mocked(NativeICloudDriveModule!.readBytes).mockResolvedValue(buffer);
  const result = await NativeICloudDrive!.readFile('/file', 'app_data', 'bytes');
  expect(result).toEqual(bytes);
  expect((result as Uint8Array).buffer).toBe(buffer);
});
