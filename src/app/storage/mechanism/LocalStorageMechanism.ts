import { injectable } from "inversify";
import { IMechanism } from "./IMechanism";
import { StorageError } from "../StorageError";

@injectable()
export class LocalStorageMechanism implements IMechanism {
  private _storage: Storage;

  constructor() {
    this._storage = window.localStorage;
  }

  async set(key: string, value: string): Promise<void> {
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

  async get(key: string): Promise<string | undefined> {
    const value = this._storage.getItem(key);

    // Check whether the retrieved value is valid.
    if (typeof value !== "string" && value !== null) {
      throw StorageError.InvalidValue;
    }

    // Convert null to undefined
    if (value === null) return undefined;

    return value;
  }

  async remove(key: string): Promise<void> {
    this._storage.removeItem(key);
  }
}