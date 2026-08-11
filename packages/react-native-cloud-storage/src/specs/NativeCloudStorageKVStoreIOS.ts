import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type KVExternalChangeEvent = {
  reason: string;
  changedKeys: string[];
};

export interface Spec extends TurboModule {
  kvGetItem(key: string): Promise<string | null>;
  kvSetItem(key: string, value: string): Promise<void>;
  kvRemoveItem(key: string): Promise<void>;
  kvGetAllKeys(): Promise<string[]>;
  kvGetAllItems(): Promise<Array<{ key: string; value: string }>>;
  kvClear(): Promise<void>;
  kvSync(): Promise<boolean>;
  readonly onKVStoreChangedExternally: CodegenTypes.EventEmitter<KVExternalChangeEvent>;
}

export default TurboModuleRegistry.get<Spec>('CloudStorageKVStore');
