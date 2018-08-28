import container from 'crunchyroll-lib/config';
import { IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';
import { IMediaSubtitle } from '../models/IMediaSubtitle';
import { IVilosSubtitle } from '../models/IVilosConfig';

export class AssSubtitle implements IMediaSubtitle {
  private _subtitle: IVilosSubtitle;
  private _isDefault: boolean;

  constructor(subtitle: IVilosSubtitle, isDefault: boolean) {
    this._subtitle = subtitle;
    this._isDefault = isDefault;
  }

  public getTitle(): string {
    return this._subtitle.title;
  }

  public async getContentAsAss(): Promise<string> {
    const http = container.get<IHttpClient>('IHttpClient');

    const response = await http.get(this._subtitle.url);

    return response.body;
  }

  public isDefault(): boolean {
    return this._isDefault;
  }

  public getId(): number | undefined {
    return undefined;
  }

  public getLanguage(): string | undefined {
    return this._subtitle.language;
  }
}
