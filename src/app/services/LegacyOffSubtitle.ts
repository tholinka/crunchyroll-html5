import { IMediaSubtitle } from '../models/IMediaSubtitle';

export class LegacyOffSubtitle implements IMediaSubtitle {
  private _file: string | undefined;
  private _isDefault: boolean;

  constructor(file: string | undefined, isDefault: boolean) {
    this._file = file;
    this._isDefault = isDefault;
  }

  public getTitle(): string {
    return 'Off';
  }

  public getFile(): string | undefined {
    return this._file;
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
    return undefined;
  }
}
