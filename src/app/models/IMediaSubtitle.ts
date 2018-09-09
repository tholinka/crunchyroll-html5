export interface IMediaSubtitle {
  getId(): number | undefined;
  getLanguage(): string | undefined;
  getTitle(): string;
  getFile(): string | undefined;
  getContentAsAss(): Promise<string | undefined>;
  isDefault(): boolean;
  setDefault(isDefault: boolean): void;
}
