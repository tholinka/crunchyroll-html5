import { Container } from "inversify";
import "reflect-metadata";
import { IStorage, IStorageSymbol } from "../app/storage/IStorage";
import { JsonStorage } from "../app/storage/JsonStorage";

const container = new Container({
  autoBindInjectable: true
});

container.bind<IStorage>(IStorageSymbol).to(JsonStorage);

export default container;
