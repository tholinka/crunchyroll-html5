let _loader: any;

export function setPlaylistLoader(loader: any): void {
  _loader = loader;
}

export function getPlaylistLoader(): any {
  return _loader;
}
