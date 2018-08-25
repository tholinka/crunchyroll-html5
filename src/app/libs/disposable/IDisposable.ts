export interface IDisposable {
  /**
   * Disposes of the object and its resources.
   */
  dispose(): void;

  /**
   * Returns whether the object has been disposed of.
   */
  isDisposed(): boolean;
}
