import container from 'crunchyroll-lib/config';
import { IHttpClient } from 'crunchyroll-lib/models/http/IHttpClient';
import { IMediaSubtitle } from '../models/IMediaSubtitle';
import { IVilosSubtitle } from '../models/IVilosConfig';

export class AssSubtitle implements IMediaSubtitle {
  private _file: string | undefined;
  private _subtitle: IVilosSubtitle;
  private _isDefault: boolean;

  constructor(
    file: string | undefined,
    subtitle: IVilosSubtitle,
    isDefault: boolean
  ) {
    this._file = file;
    this._subtitle = subtitle;
    this._isDefault = isDefault;
  }

  public getTitle(): string {
    return this._subtitle.title;
  }

  public getFile(): string | undefined {
    return this._file;
  }

  public async getContentAsAss(): Promise<string | undefined> {
    const http = container.get<IHttpClient>('IHttpClient');

    const response = await http.get(this._subtitle.url);

    return response.body;
  }

  public isDefault(): boolean {
    return this._isDefault;
  }

  public setDefault(isDefault: boolean): void {
    this._isDefault = isDefault;
  }

  public getId(): number | undefined {
    return undefined;
  }

  public getLanguage(): string | undefined {
    return this._subtitle.language;
  }
}
