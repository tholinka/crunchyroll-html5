import { IMediaSubtitle } from '../models/IMediaSubtitle';
import { IVilosStream } from '../models/IVilosConfig';
import { fromArrayBuffer } from '../utils/base64';
import { SHA1 } from '../utils/hash/sha1';

const languages: { [key: string]: string } = {
  enUS: 'English (US)',
  enGB: 'English (UK)',
  arME: 'العربية',
  frFR: 'Français (France)',
  deDE: 'Deutsch',
  itIT: 'Italiano',
  ptBR: 'Português (Brasil)',
  ptPT: 'Português (Portugal)',
  ruRU: 'Русский',
  esLA: 'Español',
  esES: 'Español (España)'
};

export class HardSubtitle implements IMediaSubtitle {
  private _stream: IVilosStream;
  private _isDefault: boolean;

  private _title: string;

  constructor(stream: IVilosStream, isDefault: boolean) {
    this._stream = stream;
    this._isDefault = isDefault;

    if (this._stream.hardsub_lang) {
      if (languages.hasOwnProperty(this._stream.hardsub_lang)) {
        this._title = languages[this._stream.hardsub_lang];
      } else {
        this._title = this._stream.hardsub_lang;
      }
    } else {
      const sha1 = new SHA1();
      const arr = stream.url.split('').map(x => x.charCodeAt(0));
      sha1.update(arr);
      this._title = 'Unknown (' + fromArrayBuffer(sha1.rawDigest()) + ')';
    }
  }

  public setDefault(isDefault: boolean): void {
    this._isDefault = isDefault;
  }

  public setTitle(title: string): void {
    this._title = title;
  }

  public getTitle(): string {
    return this._title;
  }

  public getFile(): string {
    return this._stream.url;
  }

  public async getContentAsAss(): Promise<string | undefined> {
    return undefined;
  }

  public isDefault(): boolean {
    return this._isDefault;
  }

  public getId(): number | undefined {
    return undefined;
  }

  public getLanguage(): string | undefined {
    return this._stream.hardsub_lang;
  }
}
