import { IDisposable } from "../../libs/disposable/IDisposable";

export interface ISource extends IDisposable {
  attach(element: HTMLVideoElement): void;
  detach(): void;
}