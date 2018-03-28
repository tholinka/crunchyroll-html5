import { IMechanism, StorageTestAvailabilityKey } from "./IMechanism";
import { StorageError } from "../StorageError";
import { injectable } from "inversify";

@injectable()
export class LegacyGreasemonkeyMechanism implements IMechanism {
  async set(key: string, value: string): Promise<void> {
    GM_setValue(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    const value = GM_getValue(key);
    if (typeof value !== "string" && value !== undefined) {
      throw StorageError.InvalidValue;
    }
    return value;
  }

  async remove(key: string): Promise<void> {
    GM_deleteValue(key);
  }

  static async isAvailable(): Promise<boolean> {
    try {
      GM_setValue(StorageTestAvailabilityKey, '1');
      GM_deleteValue(StorageTestAvailabilityKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}