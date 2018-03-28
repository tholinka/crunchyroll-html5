import { IMechanism, StorageTestAvailabilityKey } from "./IMechanism";
import { StorageError } from "../StorageError";
import { injectable } from "inversify";

@injectable()
export class GreasemonkeyMechanism implements IMechanism {
  async set(key: string, value: string): Promise<void> {
    await GM.setValue(key, value);
  }

  async get(key: string): Promise<string | undefined> {
    const value = await GM.getValue(key);
    if (typeof value !== "string" && value !== undefined) {
      throw StorageError.InvalidValue;
    }
    return value;
  }

  async remove(key: string): Promise<void> {
    await GM.deleteValue(key);
  }

  static async isAvailable(): Promise<boolean> {
    try {
      await GM.setValue(StorageTestAvailabilityKey, '1');
      await GM.deleteValue(StorageTestAvailabilityKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}

declare namespace GM {
  /**
   * Deletes an existing name / value pair from the script storage.
   * @param  name  a name of the pair to delete.
   * @see    {@link http://wiki.greasespot.net/GM_deleteValue}
   */
  function deleteValue(name: string): Promise<void>;

  /**
   * Retrieves a value from the script storage.
   * @param    name          a name to retrieve.
   * @param    defaultValue  a value to be returned when the name does not exist.
   * @returns  a retrieved value, or passed default value, or undefined.
   * @see      {@link http://wiki.greasespot.net/GM_getValue}
   */
  function getValue(name: string, defaultValue?: any): Promise<any>;
  function getValue(name: string, defaultValue?: string): Promise<string>;
  function getValue(name: string, defaultValue?: number): Promise<number>;
  function getValue(name: string, defaultValue?: boolean): Promise<boolean>;

  /**
   * Retrieves an array of names stored in the script storage.
   * @returns  an array of names in the storage.
   * @see      {@link http://wiki.greasespot.net/GM_listValues}
   */
  function listValues(): Promise<string[]>;

  /**
   * Stores a name / value pair to the script storage.
   * @param  name   a name of the pair.
   * @param  value  a value to be stored.
   * @see    {@link http://wiki.greasespot.net/GM_setValue}
   */
  function setValue(name: string, value: string): Promise<void>;
  function setValue(name: string, value: boolean): Promise<void>;
  function setValue(name: string, value: number): Promise<void>;
}