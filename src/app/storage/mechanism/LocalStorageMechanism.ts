import { injectable } from "inversify";
import { StorageError } from "../StorageError";
import { IMechanism, StorageTestAvailabilityKey } from "./IMechanism";

@injectable()
export class LocalStorageMechanism implements IMechanism {

  public static async isAvailable(): Promise<boolean> {
    try {
      const storage = window.localStorage;
      storage.setItem(StorageTestAvailabilityKey, '1');
      storage.removeItem(StorageTestAvailabilityKey);

      return true;
    } catch (e) {
      return false;
    }
  }
  private _storage: Storage;

  constructor() {
    this._storage = window.localStorage;
  }

  public async set(key: string, value: string): Promise<void> {
    try {
      this._storage.setItem(key, value);
    } catch (e) {
      if (this._storage.length === 0) {
        throw StorageError.StorageDisabled;
      } else {
        throw StorageError.QuotaExceeded;
      }
    }
  }

  public async get(key: string): Promise<string | undefined> {
    const value = this._storage.getItem(key);

    // Check whether the retrieved value is valid.
    if (typeof value !== "string" && value !== null) {
      throw StorageError.InvalidValue;
    }

    // Convert null to undefined
    if (value === null) return undefined;

    return value;
  }

  public async remove(key: string): Promise<void> {
    this._storage.removeItem(key);
  }
}