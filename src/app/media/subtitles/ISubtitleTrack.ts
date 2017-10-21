export interface ISubtitleTrack {
  label: string;
  getContent(): Promise<string>;
}