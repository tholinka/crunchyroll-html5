import { IDisposable } from './IDisposable';

export class Disposable implements IDisposable {
  private _disposed: boolean = false;
  private _onDisposeCallbacks: Array<() => void> = [];

  public dispose() {
    if (this.isDisposed()) return;
    this._disposed = true;

    this.disposeInternal();
  }

  public isDisposed(): boolean {
    return this._disposed;
  }

  public addOnDisposeCallback(callback: () => void, scope?: object): void {
    if (this._disposed) {
      scope !== undefined ? callback.call(scope) : callback();
      return;
    }
    this._onDisposeCallbacks.push(
      scope !== undefined ? callback.bind(scope) : callback
    );
  }

  protected disposeInternal() {
    while (this._onDisposeCallbacks.length) {
      (this._onDisposeCallbacks.shift() as () => void)();
    }
  }
}