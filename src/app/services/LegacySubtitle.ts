import { ISubtitle } from 'crunchyroll-lib/models/ISubtitle';
import { SubtitleToAss } from '../converter/SubtitleToAss';
import { IMediaSubtitle } from '../models/IMediaSubtitle';

export class LegacySubtitle implements IMediaSubtitle {
  private _subtitle: ISubtitle;

  constructor(subtitle: ISubtitle) {
    this._subtitle = subtitle;
  }

  public getTitle(): string {
    return this._subtitle.getTitle();
  }

  public async getContentAsAss(): Promise<string> {
    const converter = new SubtitleToAss(this._subtitle);

    return await converter.getContentAsAss();
  }

  public isDefault(): boolean {
    return this._subtitle.isDefault();
  }

  public getId(): number | undefined {
    return this._subtitle.getId();
  }

  public getLanguage(): string | undefined {
    return undefined;
  }
}
