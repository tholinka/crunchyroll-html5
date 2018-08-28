export interface IMediaSubtitle {
  getId(): number | undefined;
  getLanguage(): string | undefined;
  getTitle(): string;
  getContentAsAss(): Promise<string>;
  isDefault(): boolean;
}
