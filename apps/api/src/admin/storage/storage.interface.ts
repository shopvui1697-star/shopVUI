export const STORAGE_ADAPTER = 'STORAGE_ADAPTER';

export interface IStorageAdapter {
  save(filename: string, buffer: Buffer): Promise<string>;
}
