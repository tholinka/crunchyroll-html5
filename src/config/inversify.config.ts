import { Container, injectable, decorate } from "inversify";
import "reflect-metadata";
import { JsonStorage } from "../app/storage/JsonStorage";
import { IStorageSymbol, IStorage } from "../app/storage/IStorage";
import { IMechanism, IMechanismSymbol } from "../app/storage/mechanism/IMechanism";
import { LocalStorageMechanism } from "../app/storage/mechanism/LocalStorageMechanism";

const container = new Container({
  autoBindInjectable: true
});

container.bind<IStorage>(IStorageSymbol).to(JsonStorage);

export default container;