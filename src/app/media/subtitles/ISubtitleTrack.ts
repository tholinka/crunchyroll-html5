export interface ISubtitleTrack {
  label: string;
  getFile(): string | undefined;
  getContent(): Promise<string | undefined>;
}
