import { StorageError } from "../StorageError";
import { IMechanism } from "./IMechanism";
import * as browser from 'webextension-polyfill';
import { injectable } from "inversify";

@injectable()
export class WebExtensionMechanism implements IMechanism {
  async set(key: string, value: string): Promise<void> {
    const obj = {} as any;
    obj[key] = value;
    await browser.storage.local.set(obj);
  }

  async get(key: string): Promise<string> {
    const values = await browser.storage.local.get(key);
    const value = values[key];
    if (typeof value !== "string" && value !== null) {
      throw StorageError.InvalidValue;
    }
    return value;
  }

  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }
}