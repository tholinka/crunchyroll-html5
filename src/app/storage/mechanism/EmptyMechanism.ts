import { injectable } from "inversify";
import { StorageError } from "../StorageError";
import { IMechanism, StorageTestAvailabilityKey } from "./IMechanism";

@injectable()
export class EmptyMechanism implements IMechanism {
  public async set(key: string, value: string): Promise<void> {
    
  }

  public async get(key: string): Promise<string | undefined> {
    return undefined;
  }

  public async remove(key: string): Promise<void> {
    
  }
}