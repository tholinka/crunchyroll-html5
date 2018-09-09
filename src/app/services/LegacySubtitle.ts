import { ISubtitle } from 'crunchyroll-lib/models/ISubtitle';
import { SubtitleToAss } from '../converter/SubtitleToAss';
import { IMediaSubtitle } from '../models/IMediaSubtitle';

export class LegacySubtitle implements IMediaSubtitle {
  private _file: string | undefined;
  private _subtitle: ISubtitle;
  private _isDefault = false;

  constructor(file: string | undefined, subtitle: ISubtitle) {
    this._file = file;
    this._subtitle = subtitle;

    this._isDefault = subtitle.isDefault();
  }

  public getTitle(): string {
    return this._subtitle.getTitle();
  }

  public getFile(): string | undefined {
    return this._file;
  }

  public async getContentAsAss(): Promise<string | undefined> {
    const converter = new SubtitleToAss(this._subtitle);

    return await converter.getContentAsAss();
  }

  public isDefault(): boolean {
    return this._isDefault;
  }

  public setDefault(isDefault: boolean): void {
    this._isDefault = isDefault;
  }

  public getId(): number | undefined {
    return this._subtitle.getId();
  }

  public getLanguage(): string | undefined {
    return undefined;
  }
}
