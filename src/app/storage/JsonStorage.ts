import { inject, injectable } from "inversify";
import { IStorage } from "./IStorage";
import { IMechanism, IMechanismSymbol } from "./mechanism/IMechanism";
import { StorageError } from "./StorageError";

@injectable()
export class JsonStorage implements IStorage {
  constructor(
    @inject(IMechanismSymbol) protected _mechanism: IMechanism
  ) {}

  /**
   * Set the value of key.
   * @param key the key of the value to be set.
   * @param value the value to be set.
   */
  public async set(key: string, value: any): Promise<void> {
    if (value === undefined) {
      return await this._mechanism.remove(key);
    }
    await this._mechanism.set(key, JSON.stringify(value));
  }

  /**
   * Returns the value with key.
   * @param key the key of the value.
   */
  public async get(key: string): Promise<any> {
    let json: string|undefined;
    try {
      json = await this._mechanism.get(key);
    } catch (e) {
      return undefined;
    }

    if (json === undefined) {
      return undefined;
    }

    try {
      return JSON.parse(json);
    } catch (e) {
      throw StorageError.InvalidValue;
    }
  }

  /**
   * Removes the value with key.
   * @param key 
   */
  public async remove(key: string): Promise<void> {
    await this._mechanism.remove(key);
  }
}