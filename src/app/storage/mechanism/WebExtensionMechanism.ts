import { injectable } from "inversify";
import * as browser from 'webextension-polyfill';
import { StorageError } from "../StorageError";
import { IMechanism } from "./IMechanism";

@injectable()
export class WebExtensionMechanism implements IMechanism {
  public async set(key: string, value: string): Promise<void> {
    const obj = {} as any;
    obj[key] = value;
    await browser.storage.local.set(obj);
  }

  public async get(key: string): Promise<string> {
    const values = await browser.storage.local.get(key);
    const value = values[key];
    if (typeof value !== "string" && value !== null) {
      throw StorageError.InvalidValue;
    }
    return value;
  }

  public async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }
}