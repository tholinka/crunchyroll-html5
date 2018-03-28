export interface IMechanism {
  /**
   * Set a value with key.
   * @param key The key of the value to set.
   * @param value The value to set.
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Returns the value of the key.
   * @param key The key of the value to get.
   */
  get(key: string): Promise<string|undefined>;

  /**
   * Remove a value with key.
   * @param key the key of the value to remove.
   */
  remove(key: string): Promise<void>;
}

export const IMechanismSymbol = Symbol.for("IMechanismSymbol");
export const StorageTestAvailabilityKey = '__sak';