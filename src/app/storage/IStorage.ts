export interface IStorage {
  set<T = any>(key: string, value: T|undefined): Promise<void>;
  get<T = any>(key: string): Promise<T|undefined>;
  remove(key: string): Promise<void>;
}

export const IStorageSymbol = Symbol.for("IStorage");