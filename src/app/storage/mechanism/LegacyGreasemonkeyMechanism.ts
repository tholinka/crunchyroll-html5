import { injectable } from 'inversify';
import { StorageError } from '../StorageError';
import { IMechanism, StorageTestAvailabilityKey } from './IMechanism';

@injectable()
export class LegacyGreasemonkeyMechanism implements IMechanism {
  public static async isAvailable(): Promise<boolean> {
    try {
      GM_setValue(StorageTestAvailabilityKey, '1');
      GM_deleteValue(StorageTestAvailabilityKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  public async set(key: string, value: string): Promise<void> {
    GM_setValue(key, value);
  }

  public async get(key: string): Promise<string | undefined> {
    const value = GM_getValue(key);
    if (typeof value !== 'string' && value !== undefined) {
      throw StorageError.InvalidValue;
    }
    return value;
  }

  public async remove(key: string): Promise<void> {
    GM_deleteValue(key);
  }
}
