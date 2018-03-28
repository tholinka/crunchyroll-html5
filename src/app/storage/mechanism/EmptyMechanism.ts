import { IMechanism, StorageTestAvailabilityKey } from "./IMechanism";
import { StorageError } from "../StorageError";
import { injectable } from "inversify";

@injectable()
export class EmptyMechanism implements IMechanism {
  async set(key: string, value: string): Promise<void> {
    
  }

  async get(key: string): Promise<string | undefined> {
    return undefined;
  }

  async remove(key: string): Promise<void> {
    
  }
}